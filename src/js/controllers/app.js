/**
 * APP
 *
 * The app controller manages the global scope.
 */

var util = require('util'),
    events = require('events'),
    rewriter = require('../util/jsonrewriter'),
    genericUtils = require('../util/generic'),
    Amount = ripple.Amount;

var module = angular.module('app', []);

module.controller('AppCtrl', ['$rootScope', '$compile', 'rpId', 'rpNetwork',
                              'rpKeychain', 'rpTxQueue', 'rpAppManager', 'rpTracker',
                              '$location', '$timeout', 'rpHistory',
                              function ($scope, $compile, $id, $net,
                                        keychain, txQueue, appManager, rpTracker,
                                        $location, $timeout, rpHistory)
{
  reset();

  var account;

  // For announcement banner

  store.set('announcement', false);
  $scope.showAnnouncement = store.get('announcement');

  //if('undefined' === typeof $scope.showAnnouncement) $scope.showAnnouncement = true;
  //
  //$scope.dismissBanner = function() {
  //  store.set('announcement', false);
  //  $scope.showAnnouncement = store.get('announcement');
  //};

  // Global reference for debugging only (!)
  if ("object" === typeof rippleclient) {
    rippleclient.id = $id;
    rippleclient.net = $net;
    rippleclient.keychain = keychain;
  }

  function reset()
  {
    $scope.apps = [];
    $scope.account = {};
    $scope.lines = {};
    $scope.offers = {};
    $scope.events = [];
    $scope.history = [];
    $scope.balances = {};
    $scope.loadState = [];
    $scope.unseenNotifications = {
      count: 0
    };
  }

  // Load notification modal
  $scope.load_notification = function(status) {
    if (typeof status !== 'string') {
      console.log("You must pass in a string for the status");
      return;
    }

    $scope.notif = status;

    $timeout(function() {
      $scope.notif = "clear";
    }, 7000);
  }

  // TODO fix this
  $scope.reset = function(){
    reset();
  };

  var myHandleAccountEvent;
  var myHandleAccountEntry;

  function handleAccountLoad(e, data)
  {
    var remote = $net.remote;

    account = data.account;

    reset();

    var accountObj = remote.account(data.account);

    // We need a reference to these functions after they're bound, so we can
    // unregister them if the account is unloaded.
    myHandleAccountEvent = handleAccountEvent;
    myHandleAccountEntry = handleAccountEntry;
    $scope.loadingAccount = true;

    accountObj.on('transaction', myHandleAccountEvent);
    accountObj.on('entry', function(data){
      $scope.$apply(function () {
        $scope.loadingAccount = false;
        myHandleAccountEntry(data);
      });
    });

    accountObj.entry(function (err, entry) {
      if (err) {
        $scope.loadingAccount = false;
        $scope.loadState.account = true;
      }
    });

    // Ripple credit lines
    remote.requestAccountLines({account: data.account})
      .on('success', handleRippleLines)
      .on('error', handleRippleLinesError).request();

    // Outstanding offers
    remote.requestAccountOffers({account: data.account})
      .on('success', handleOffers)
      .on('error', handleOffersError).request();

    // Transactions
    remote.request_account_tx({
      'account': data.account,
      'ledger_index_min': -1,
      'descending': true,
      'limit': Options.transactions_per_page
    })
    .on('success', handleAccountTx)
    .on('error', handleAccountTxError).request();

    loadB2r();
  }

  function handleAccountUnload(e, data)
  {
    if (myHandleAccountEvent && myHandleAccountEntry) {
      var remote = $net.remote;
      var accountObj = remote.account(data.account);
      accountObj.removeListener('transaction', myHandleAccountEvent);
      accountObj.removeListener('entry', myHandleAccountEntry);
    }
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

      $scope.$broadcast('$balancesUpdate');

      $scope.loadState.lines = true;
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
          pays: ripple.Amount.from_json(offerData.taker_pays),
          flags: offerData.flags
        };

        updateOffer(offer);
      });
      console.log('offers updated:', $scope.offers);
      $scope.$broadcast('$offersUpdate');

      $scope.loadState.offers = true;
    });
  }

  function handleOffersError(data)
  {
    $scope.$apply(function () {
      $scope.loadState.offers = true;
    });
  }

  function handleAccountEntry(data)
  {
    var remote = $net.remote;
    $scope.account = data;

    // XXX Shouldn't be using private methods
    var server = remote._getServer();

    // As per json wire format convention, real ledger entries are CamelCase,
    // e.g. OwnerCount, additional convenience fields are lower case, e.g.
    // reserve, max_spend.
    var ownerCount  = $scope.account.OwnerCount || 0;
    $scope.account.reserve_base = server._reserve(0);
    $scope.account.reserve = server._reserve(ownerCount);
    $scope.account.reserve_to_add_trust = server._reserve(ownerCount+1);
    $scope.account.reserve_low_balance = $scope.account.reserve.product_human(2);

    // Maximum amount user can spend
    var bal = Amount.from_json(data.Balance);
    $scope.account.max_spend = bal.subtract($scope.account.reserve);

    $scope.loadState.account = true;

    // Transaction queue
    txQueue.checkQueue();
  }

  function handleAccountTx(data)
  {
    $scope.$apply(function () {
      $scope.tx_marker = data.marker;
      if (data.transactions) {
        data.transactions.reverse().forEach(function (e, key) {
          processTxn(e.tx, e.meta, true);
        });
      }
      $scope.$broadcast('$eventsUpdate');

      $scope.loadState.transactions = true;
    })
  }

  function handleAccountTxError(data)
  {
    $scope.$apply(function () {
      $scope.loadState.transactions = true;
    });
  }

  function handleAccountEvent(e)
  {
    $scope.$apply(function () {
      processTxn(e.transaction, e.meta);
      $scope.$broadcast('$eventsUpdate');
    });
  }

  /**
   * Process a transaction and add it to the history table.
   */
  function processTxn(tx, meta, is_historic)
  {
    var processedTxn = rewriter.processTxn(tx, meta, account);

    if (processedTxn && processedTxn.error) {
      var err = processedTxn.error;
      rpTracker.trackError('JsonRewriter Error', err, {
        'Transaction Hash': processedTxn.transaction.hash,
        'Source': is_historic ? 'app controller historic' : 'app controller event'
      });
      console.error('Error processing transaction '+processedTxn.transaction.hash+'\n',
                    err && 'object' === typeof err && err.stack ? err.stack : err);

      // Add to history only
      $scope.history.unshift(processedTxn);
    } else if (processedTxn) {
      var transaction = processedTxn.transaction;

      // Update account
      if (processedTxn.accountRoot) {
        handleAccountEntry(processedTxn.accountRoot);
      }

      // Show status notification
      if (processedTxn.tx_result === "tesSUCCESS" &&
          transaction &&
          !is_historic) {

        $scope.$broadcast('$appTxNotification', {
          hash:tx.hash,
          tx: transaction
        });
      }

      // Add to recent notifications
      if (processedTxn.tx_result === "tesSUCCESS" &&
          transaction) {

        var effects = [];
        // Only show specific transactions
        switch (transaction.type) {
          case 'offernew':
          case 'exchange':
            var funded = false;
            processedTxn.effects.some(function(effect) {
              if (_.contains(['offer_bought','offer_funded','offer_partially_funded'], effect.type)) {
                funded = true;
                effects.push(effect);
                return true;
              }
            });

            // Only show trades/exchanges which are at least partially funded
            if (!funded) {
              break;
            }
            /* falls through */
          case 'received':

            // Is it unseen?
            if (processedTxn.date > ($scope.userBlob.data.lastSeenTxDate || 0)) {
              processedTxn.unseen = true;
              $scope.unseenNotifications.count++;
            }

            processedTxn.showEffects = effects;
            $scope.events.unshift(processedTxn);
        }
      }

      // TODO Switch to txmemo field
      appManager.getAllApps(function(apps){
        _.each(apps, function(app){
          var historyProfile;
          if (historyProfile = app.findProfile('history')) {
            historyProfile.getTransactions($scope.address, function(err, history){
              history.forEach(function(tx){
                tx.app = app;
                if (processedTxn.hash === tx.hash) {
                  processedTxn.details = tx;
                }
              });
            });
          }
        });
      });

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
              flags: effect.flags
            };

            updateOffer(offer);
          }
        });

        $scope.$broadcast('$offersUpdate');
      }
    }
  }

  function updateOffer(offer)
  {
    if (offer.flags && offer.flags === ripple.Remote.flags.offer.Sell) {
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

    var balancesUpdated;

    $.each(effects, function () {
      if (_.contains([
        'trust_create_local',
        'trust_create_remote',
        'trust_change_local',
        'trust_change_remote',
        'trust_change_balance',
        'trust_change_no_ripple'], this.type))
      {
        var effect = this,
            line = {},
            index = effect.counterparty + effect.currency;

        line.currency = effect.currency;
        line.account = effect.counterparty;
        line.flags = effect.flags;
        line.no_ripple = !!effect.noRipple; // Force Boolean

        if (effect.balance) {
          line.balance = effect.balance;
          updateRippleBalance(effect.currency,
                                    effect.counterparty,
                                    effect.balance);
          balancesUpdated = true;
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

    if (balancesUpdated) $scope.$broadcast('$balancesUpdate');
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
      return a.compareTo(b);
    });

    balance.total = null;
    for (var counterparty in balance.components) {
      var amount = balance.components[counterparty];
      balance.total = balance.total ? balance.total.add(amount) : amount;
    }

    // Try to identify the gateway behind this balance
    // TODO be more smart doing requests, one app may have multiple currencies
    appManager.getApp(new_account, function(err, app){
      if (err) {
        console.warn(err);
        return;
      }

      var gateway = {
        app: app,
        inboundBridge: app.getInboundBridge(currency)
      };

      balance.components[new_account].gateway = gateway;

      // User's gateway account
      app.findProfile('account').getUser($scope.address, function(err, user){
        if (err) {
          console.warn(err);
          return;
        }

        gateway.user = user;

        // Get inbound bridge instructions
        gateway.inboundBridge.getInstructions($scope.address,function(err, instructions){
          if (err) {
            console.warn(err);
            return;
          }

          // TODO ...
          // if (!user.verified && gateway.inboundBridge.currencies[0].limit && balance) {
          //   gateway.inboundBridge.limit = gateway.inboundBridge.currencies[0].limit - balance.components[new_account].to_human();
          // }

          gateway.inboundBridge.limit = $scope.B2R.currencies[0].limit;

          gateway.inboundBridge.instructions = instructions;
        });
      });
    });
  }

  /**
   * Integrations
   */
  function loadB2r() {
    $scope.loadState.B2RApp = false;
    $scope.loadState.B2RInstructions = false;

    // B2R
    appManager.loadApp(Options.b2rAddress, function(err, app){
      if (err) {
        console.warn('Error loading app', err.message);
        return;
      }

      $scope.B2RApp = app;

      $scope.B2R = app.getInboundBridge('BTC');

      appManager.save(app);

      app.refresh = function() {
        app.findProfile('account').getUser($scope.address, function(err, user){
          $scope.loadState.B2RApp = true;

          if (err) {
            console.log('Error', err);
            return;
          }

          $scope.B2R.active = user;

          // TODO ...
          // if (!user.verified && $scope.B2R.currencies[0].limit && $scope.balances['BTC']) {
          //   $scope.B2R.limit = $scope.B2R.currencies[0].limit - $scope.balances['BTC'].components['rhxULAn1xW9T4V2u67FX9pQjSz4Tay2zjZ'].to_human();
          // } else {
          $scope.B2R.limit = $scope.B2R.currencies[0].limit;
          // }

          // Do the necessary trust
          var trust = _.findWhere($scope.B2R.currencies, {currency: 'BTC'});
          $scope.B2R.trust(trust.currency,trust.issuer);

          // Get pending transactions
          $scope.B2R.getPending($scope.address, function(err, pending){
            // TODO support multiple pending transactions
            $scope.pending = pending[0];
          });

          // Get deposit instructions
          $scope.B2R.getInstructions($scope.address,function(err, instructions){
            if (err) {
              return;
            }

            $scope.B2R.instructions = instructions;
            $scope.loadState.B2RInstructions = true;
          });
        });
      };

      var watcher = $scope.$watch('address', function(address){
        if (!address) return;

        app.refresh();
        watcher();
      });

      // Required fields
      $scope.B2RSignupFields = app.findProfile('account').getFields();
    });
  }

  $scope.currencies_all = require('../data/currencies');

  // Personalized default pair set
  if (!store.disabled && !store.get('ripple_pairs_all')) {
    store.set('ripple_pairs_all',require('../data/pairs'));
  }

  var pairs_all = store.get('ripple_pairs_all');
  var pairs_default = require('../data/pairs');
  $scope.pairs_all = genericUtils.uniqueObjArray(pairs_all, pairs_default, 'name');

  function compare(a, b) {
    if (a.order < b.order) return 1;
    if (a.order > b.order) return -1;
    return 0;
  }

  // sort currencies and pairs by order
  $scope.currencies_all.sort(compare);

  function compare_last_used(a, b) {
    var time_a = a.last_used || a.order || 0;
    var time_b = b.last_used || b.order || 0;
    if (time_a < time_b) return 1;
    if (time_a > time_b) return -1;
    return 0;
  }
  $scope.pairs_all.sort(compare_last_used);

  $scope.currencies_all_keyed = {};
  _.each($scope.currencies_all, function(currency){
    $scope.currencies_all_keyed[currency.value] = currency;
  });

  $scope.$watch('currencies_all', function(){
    if (!store.disabled) {
      store.set('ripple_currencies_all',$scope.currencies_all);
    }
  }, true);

  $scope.$watch('pairs_all', function(){
    if (!store.disabled) {
      store.set('ripple_pairs_all',$scope.pairs_all);
    }
  }, true);

  $scope.pairs = $scope.pairs_all.slice(1);
  $timeout(function() {
    $scope.app_loaded = 'loaded';
    $("body").removeClass("loading");
  }, 100);

  // Moved this to the run block
  // Nav links same page click fix
  // $('nav a').click(function(){
  //   if (location.hash == this.hash) {
  //     location.href="#/";
  //     location.href=this.href;
  //   }
  // });

  $scope.$on('$idAccountLoad', function (e, data) {
    // Server is connected
    if ($scope.connected) {
      handleAccountLoad(e, data);
    }

    // Server is not connected yet. Handle account load after server response.
    $scope.$on('$netConnected', function(){
      if ($.isEmptyObject($scope.account)) {
        $scope.$broadcast('$idAccountUnload', {account: $scope.account});
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
  appManager.init();

  $scope.logout = function () {
    $id.logout();
    location.reload();
  };

  $scope.$on('$idRemoteLogout', handleRemoteLogout);
  function handleRemoteLogout()
  {
    location.reload();
  }

  // Generate an array of source currencies for path finding.
  // This will generate currencies for every issuers.
  // It will also generate a self-issue currency for currencies which have multi issuers.
  //
  // Example balances for account rEXAMPLE:
  //   CNY: rCNY1
  //        rCNY2
  //   BTC: rBTC
  // Will generate:
  //   CNY/rEXAMPLE
  //   CNY/rCNY1
  //   CNY/rCNY2
  //   BTC/rBTC
  $scope.generate_src_currencies = function () {
    var src_currencies = [];
    var balances = $scope.balances;
    var isIssuer = $scope.generate_issuer_currencies();
    src_currencies.push({ currency: "XRP" });
    for (var currency_name in balances) {
      if (!balances.hasOwnProperty(currency_name)) continue;

      var currency = balances[currency_name];
      var currency_hex = currency.total.currency().to_hex();
      var result = [];
      for (var issuer_name in currency.components)
      {
        if (!currency.components.hasOwnProperty(issuer_name)) continue;
        var component = currency.components[issuer_name];
        if (component.is_positive())
          result.push({ currency: currency_hex, issuer: issuer_name});
      }

      if (result.length > 1 || isIssuer[currency_hex] || result.length === 0)
        result.unshift({ currency: currency_hex });

      src_currencies = src_currencies.concat(result);
    }
    return src_currencies;
  };

  $scope.generate_issuer_currencies = function () {
    var isIssuer = {};
    _.each($scope.lines, function(line){
      if (line.limit_peer.is_positive()) {
        isIssuer[line.balance.currency().to_hex()] = true;
      }
    });
    return isIssuer;
  };

  /**
   * Testing hooks
   */
  this.reset                  =  reset;
  this.handleAccountLoad      =  handleAccountLoad;
  this.handleAccountUnload    =  handleAccountUnload;
  this.handleRemoteLogout     =  handleRemoteLogout;
  this.handleRippleLines      =  handleRippleLines;
  this.handleRippleLinesError =  handleRippleLinesError;
  this.handleOffers           =  handleOffers;
  this.handleOffersError      =  handleOffersError;
  this.handleAccountEntry     =  handleAccountEntry;
  this.handleAccountTx        =  handleAccountTx;
  this.handleAccountTxError   =  handleAccountTxError;
  this.handleAccountEvent     =  handleAccountEvent;
  this.processTxn             =  processTxn;
  this.updateOffer            =  updateOffer;
  this.updateLines            =  updateLines;
  this.updateRippleBalance    =  updateRippleBalance;
  this.compare                =  compare;
  this.handleFirstConnection  =  handleFirstConnection;
}]);
