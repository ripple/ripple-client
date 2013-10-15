/**
 * APP
 *
 * The app controller manages the global scope.
 */

var util = require('util'),
    events = require('events'),
    rewriter = require('../util/jsonrewriter'),
    Amount = ripple.Amount;

var module = angular.module('app', []);

module.controller('AppCtrl', ['$rootScope', '$compile', 'rpId', 'rpNetwork',
                              function ($scope, $compile, $id, $net)
{
  reset();

  var account;

  // Global reference for debugging only (!)
  if ("object" === typeof rippleclient) {
    rippleclient.id = $id;
    rippleclient.net = $net;
  }

  function reset()
  {
    $scope.account = {};
    $scope.lines = {};
    $scope.offers = {};
    $scope.events = [];
    $scope.history = [];
    $scope.balances = {};
    $scope.loadState = [];
  }

  var myHandleAccountEvent;
  var myHandleAccountEntry;

  function handleAccountLoad(e, data)
  {
    var remote = $net.remote;

    account = data.account;

    reset();

    remote.set_secret(data.account, data.secret);

    var accountObj = remote.account(data.account);

    // We need a reference to these functions after they're bound, so we can
    // unregister them if the account is unloaded.
    myHandleAccountEvent = handleAccountEvent;
    myHandleAccountEntry = handleAccountEntry;

    accountObj.on('transaction', myHandleAccountEvent);
    accountObj.on('entry', myHandleAccountEntry);

    accountObj.entry(function (err, entry) {
      if (err) {
        $scope.loadState['account'] = true;
      }
    });

    // Ripple credit lines
    remote.request_account_lines(data.account)
      .on('success', handleRippleLines)
      .on('error', handleRippleLinesError).request();

    // Transactions
    remote.request_account_tx({
      'account': data.account,
      'ledger_index_min': -1,
      'limit': Options.transactions_per_page
    })
      .on('success', handleAccountTx)
      .on('error', handleAccountTxError).request();

    // Outstanding offers
    remote.request_account_offers(data.account)
      .on('success', handleOffers)
      .on('error', handleOffersError).request();
  }

  function handleAccountUnload(e, data)
  {
    var remote = $net.remote;
    var accountObj = remote.account(data.account);
    accountObj.removeListener('transaction', myHandleAccountEvent);
    accountObj.removeListener('entry', myHandleAccountEntry);
  }

  function handleRippleLines(data)
  {
    $scope.$apply(function () {
      $scope.lines = {};

      for (var n=0, l=data.lines.length; n<l; n++) {
        var line = data.lines[n];

        // XXX: This reinterpretation of the server response should be in the
        //      library upstream.
        line = $.extend({}, line, {
          limit: ripple.Amount.from_json({value: line.limit, currency: line.currency, issuer: line.account}),
          limit_peer: ripple.Amount.from_json({value: line.limit_peer, currency: line.currency, issuer: account}),
          balance: ripple.Amount.from_json({value: line.balance, currency: line.currency, issuer: account})
        });

        $scope.lines[line.account+line.currency] = line;
        updateRippleBalance(line.currency, line.account, line.balance);
      }
      console.log('lines updated:', $scope.lines);

      $scope.loadState['lines'] = true;
    });
  }

  function handleRippleLinesError(data)
  {
    $scope.$apply(function () {
      $scope.loadState['lines'] = true;
    });
  }

  function handleOffers(data)
  {
    $scope.$apply(function () {
      data.offers.forEach(function (offerData) {
        var offer = {
          seq: +offerData.seq,
          gets: ripple.Amount.from_json(offerData.taker_gets),
          pays: ripple.Amount.from_json(offerData.taker_pays)
        };

        updateOffer(offer);
      });
      console.log('offers updated:', $scope.offers);

      $scope.loadState['offers'] = true;
    });
  }

  function handleOffersError(data)
  {
    $scope.$apply(function () {
      $scope.loadState['offers'] = true;
    });
  }

  function handleAccountEntry(data)
  {
    var remote = $net.remote;
    $scope.$apply(function () {
      $scope.account = data;

      // As per json wire format convention, real ledger entries are CamelCase,
      // e.g. OwnerCount, additional convenience fields are lower case, e.g.
      // reserve, max_spend.
      var reserve_base = Amount.from_json(""+remote._reserve_base),
          reserve_inc  = Amount.from_json(""+remote._reserve_inc),
          owner_count  = $scope.account.OwnerCount || 0;
      $scope.account.reserve_base = reserve_base;
      $scope.account.reserve = reserve_base.add(reserve_inc.product_human(owner_count));
      $scope.account.reserve_to_add_trust = reserve_base.add(reserve_inc.product_human(owner_count+1));
      $scope.account.reserve_low_balance = $scope.account.reserve.product_human(2);

      // Maximum amount user can spend
      var bal = Amount.from_json(data.Balance);
      $scope.account.max_spend = bal.subtract($scope.account.reserve);

      $scope.loadState['account'] = true;
    });
  }

  function handleAccountTx(data)
  {
    $scope.$apply(function () {
      $scope.history_count = data.count;
      $scope.tx_marker = data.marker;

      if (data.transactions) {
        data.transactions.reverse().forEach(function (e) {
          processTxn(e.tx, e.meta, true);
        });
      }

      $scope.loadState['transactions'] = true;
    });
  }
  function handleAccountTxError(data)
  {
    $scope.$apply(function () {
      $scope.loadState['transactions'] = true;
    });
  }

  function handleAccountEvent(e)
  {
    $scope.$apply(function () {
      processTxn(e.transaction, e.meta);
    });
  }

  /**
   * Process a transaction and add it to the history table.
   */
  function processTxn(tx, meta, is_historic)
  {
    var processedTxn = rewriter.processTxn(tx, meta, account);

    if (processedTxn) {
      var transaction = processedTxn.transaction;

      // Show status notification
      if (processedTxn.tx_result === "tesSUCCESS" &&
          transaction &&
          !is_historic) {
        $scope.$broadcast('$appTxNotification', transaction);
      }

      // Add to recent notifications
      if (processedTxn.tx_result === "tesSUCCESS") {
        $scope.events.unshift(processedTxn);
      }

      // Add to history
      $scope.history.unshift(processedTxn);

      // Update Ripple lines
      if (processedTxn.effects && !is_historic) {
        updateLines(processedTxn.effects);
      }

      // Update my offers
      if (processedTxn.effects && !is_historic) {
        // Iterate on each effect to find offers
        processedTxn.effects.forEach(function (effect) {
          // Only these types are offers
          if (_.contains([
            'offer_created',
            'offer_funded',
            'offer_partially_funded',
            'offer_cancelled'], effect.type))
          {
            var offer = {
              seq: +effect.seq,
              gets: effect.gets,
              pays: effect.pays,
              deleted: effect.deleted,
              flags: processedTxn.transaction.flags
            };

            updateOffer(offer);
          }
        });
      }
    }
  }

  function updateOffer(offer)
  {
    if (offer.flags && offer.flags === ripple.Transaction.flags.OfferCreate.Sell) {
      offer.type = 'sell';
      offer.first = offer.gets;
      offer.second = offer.pays;
    } else {
      offer.type = 'buy';
      offer.first = offer.pays;
      offer.second = offer.gets;
    }

    if (!offer.deleted) {
      $scope.offers[""+offer.seq] = offer;
    } else {
      delete $scope.offers[""+offer.seq];
    }
  }

  function updateLines(effects)
  {
    if (!$.isArray(effects)) return;

    $.each(effects, function () {
      if (_.contains([
        'trust_create_local',
        'trust_create_remote',
        'trust_change_local',
        'trust_change_remote',
        'trust_change_balance'], this.type))
      {
        var effect = this,
            line = {},
            index = effect.counterparty + effect.currency;

        line.currency = effect.currency;
        line.account = effect.counterparty;

        if (effect.balance) {
          line.balance = effect.balance;
          updateRippleBalance(effect.currency,
                                    effect.counterparty,
                                    effect.balance);
        }

        if (effect.deleted) {
          delete $scope.lines[index];
          return;
        }

        if (effect.limit) {
          line.limit = effect.limit;
        }

        if (effect.limit_peer) {
          line.limit_peer = effect.limit_peer;
        }

        $scope.lines[index] = $.extend($scope.lines[index], line);
      }
    });
  }

  function updateRippleBalance(currency, new_account, new_balance)
  {
    // Ensure the balances entry exists first
    if (!$scope.balances[currency]) {
      $scope.balances[currency] = {components: {}, total: null};
    }

    var balance = $scope.balances[currency];

    if (new_account) {
      balance.components[new_account] = new_balance;
    }

    $(balance.components).sort(function(a,b){
      debugger
      return a.compareTo(b);
    });

    balance.total = null;
    for (var counterparty in balance.components) {
      var amount = balance.components[counterparty];
      balance.total = balance.total ? balance.total.add(amount) : amount;
    }
  }

  // Personalized default currency set
  if (!store.get('ripple_currencies_all')) {
    store.set('ripple_currencies_all',require('../data/currencies'));
  }

  $scope.currencies_all = store.get('ripple_currencies_all')
    ? store.get('ripple_currencies_all')
    : require('../data/currencies');

  // Personalized default pair set
  if (!store.get('ripple_pairs_all')) {
    store.set('ripple_pairs_all',require('../data/pairs'));
  }

  $scope.pairs_all = store.get('ripple_pairs_all')
    ? store.get('ripple_pairs_all')
    : require('../data/pairs');

  function compare(a, b) {
    if (a.order < b.order) return 1;
    if (a.order > b.order) return -1;
    return 0;
  }

  // sort currencies and pairs by order
  $scope.currencies_all.sort(compare);
  $scope.pairs_all.sort(compare);

  $scope.$watch('currencies_all', function(){
    store.set('ripple_currencies_all',$scope.currencies_all);
  }, true);

  $scope.$watch('pairs_all', function(){
    store.set('ripple_pairs_all',$scope.pairs_all);
  }, true);

  $scope.currencies = $scope.currencies_all.slice(1);
  $scope.pairs = $scope.pairs_all.slice(1);

  // Enable screen
  $('body').addClass('loaded');

  // Nav links same page click fix
  $('nav a').click(function(){
    if (location.hash === this.hash) {
      location.href="#/";
      location.href=this.href;
    }
  });

  // Add status box to DOM
  var template = require('../../jade/client/status.jade')();
  $compile(template)($scope, function (el, $scope) {
    el.appendTo('header');
  });

  $scope.$on('$idAccountLoad', function (e, data) {
    // Server is connected
    if ($scope.connected) {
      handleAccountLoad(e, data);
    }

    // Server is not connected yet. Handle account load after server response.
    $scope.$on('$netConnected', function(){
      if ($.isEmptyObject($scope.account)) {
        handleAccountLoad(e, data);
      }
    });
  });

  $scope.$on('$idAccountUnload', handleAccountUnload);

  // XXX: The app also needs to handle updating its data when the connection is
  //      lost and later re-established. (... or will the Ripple lib do that for us?)
  var removeFirstConnectionListener =
        $scope.$on('$netConnected', handleFirstConnection);
  function handleFirstConnection() {
    removeFirstConnectionListener();
  }

  $net.listenId($id);
  $net.init();
  $id.init();
}]);
