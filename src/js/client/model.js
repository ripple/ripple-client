var util = require('util'),
    events = require('events'),
    rewriter = require('../util/jsonrewriter'),
    Amount = ripple.Amount;

/**
 * Class listening to Ripple network state and updating models.
 *
 * This class handles all incoming events by the network and updates
 * the appropriate local models.
 */
var Model = function ()
{
  events.EventEmitter.call(this);
};
util.inherits(Model, events.EventEmitter);

Model.prototype.init = function ()
{
  var self = this;
  var $scope = this.app.$scope;

  this.reset();

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

  this.app.id.on('accountload', function(account){
    // Server is connected
    if ($scope.connected) {
      self.handleAccountLoad(account);
    }

    // Server is not connected yet. Handle account load after server response
    self.app.net.on('connected', function(){
      if (!$scope.account.length || $scope.account.length < 1) {
        self.handleAccountLoad(account);
      }
    });
  });

  this.app.id.on('accountunload', this.handleAccountUnload.bind(this));
};

Model.prototype.reset = function ()
{
  var $scope = this.app.$scope;

  $scope.account = {};
  $scope.lines = {};
  $scope.offers = {};
  $scope.events = [];
  $scope.history = [];
  $scope.balances = {};
}

Model.prototype.setApp = function (app)
{
  this.app = app;
};

/**
 * Setup listeners for identity state.
 *
 * Causes the initialization of account model data.
 */
Model.prototype.listenId = function (id)
{
};

Model.prototype.handleAccountLoad = function (e)
{
  var $scope = this.app.$scope;
  var remote = this.app.net.remote;

  this.reset();

  remote.set_secret(e.account, e.secret);

  remote.request_account_lines(e.account)
    .on('success', this.handleRippleLines.bind(this))
    .on('error', this.handleRippleLinesError.bind(this)).request();
  remote.request_account_tx(e.account, 0, 9999999, true, 200)
    .on('success', this.handleAccountTx.bind(this))
    .on('error', this.handleAccountTxError.bind(this)).request();
  remote.request_account_offers(e.account)
    .on('success', this.handleOffers.bind(this))
    .on('error', this.handleOffersError.bind(this)).request();

  // We need a reference to these functions after they're bound, so we can
  // unregister them if the account is unloaded.
  this.handleAccountEvent = this.handleAccountEvent.bind(this);
  this.handleAccountEntry = this.handleAccountEntry.bind(this);

  var account = remote.account(e.account);
  account.on('transaction', this.handleAccountEvent);
  account.on('entry', this.handleAccountEntry);

  account.entry(function (err, entry) {
    if (err) {
      // XXX: Our account does not exist, we should do something with that
      //      knowledge.
    }
  });

  if(!$scope.$$phase) {
    $scope.$digest();
  }
};

Model.prototype.handleAccountUnload = function (e)
{
  var remote = this.app.net.remote;
  var account = remote.account(e.account);
  account.removeListener('transaction', this.handleAccountEvent);
  account.removeListener('entry', this.handleAccountEntry);
};

Model.prototype.handleRippleLines = function (data)
{
  var self = this,
      app = this.app,
      $scope = app.$scope;

  $scope.$apply(function () {
    $scope.lines = {};

    for (var n=0, l=data.lines.length; n<l; n++) {
      var line = data.lines[n];

      // XXX: This reinterpretation of the server response should be in the
      //      library upstream.
      line = $.extend({}, line, {
        limit: ripple.Amount.from_json({value: line.limit, currency: line.currency, issuer: line.account}),
        limit_peer: ripple.Amount.from_json({value: line.limit_peer, currency: line.currency, issuer: app.id.account}),
        balance: ripple.Amount.from_json({value: line.balance, currency: line.currency, issuer: app.id.account})
      });

      $scope.lines[line.account+line.currency] = line;
      self._updateRippleBalance(line.currency, line.account, line.balance);
    }
    console.log('lines updated:', $scope.lines);
  });
};

Model.prototype.handleRippleLinesError = function (data)
{
}

Model.prototype.handleOffers = function (data)
{
  var self = this;
  var $scope = this.app.$scope;

  $scope.$apply(function ()
  {
    data.offers.forEach(function (offerData) {
      var offer = {
        seq: +offerData.seq,
        gets: ripple.Amount.from_json(offerData.taker_gets),
        pays: ripple.Amount.from_json(offerData.taker_pays)
      };

      self._updateOffer(offer);
    });
    console.log('offers updated:', $scope.offers);
  });
};

Model.prototype.handleOffersError = function (data)
{
}

Model.prototype.handleAccountEntry = function (data)
{
  var self = this;
  var remote = this.app.net.remote;
  var $scope = this.app.$scope;
  $scope.$apply(function () {
    $scope.account = data;

    // As per json wire format convention, real ledger entries are CamelCase,
    // e.g. OwnerCount, additional convenience fields are lower case, e.g.
    // reserve, max_spend.
    var reserve_base = Amount.from_json(""+remote._reserve_base),
        reserve_inc  = Amount.from_json(""+remote._reserve_inc),
        owner_count  = $scope.account.OwnerCount || "0";
    $scope.account.reserve = reserve_base.add(reserve_inc.product_human(owner_count));
    $scope.account.reserve_to_add_trust = reserve_base.add(reserve_inc.product_human(owner_count+1));

    // Maximum amount user can spend
    var bal = Amount.from_json(data.Balance);
    $scope.account.max_spend = bal.subtract($scope.account.reserve);
  });
};

Model.prototype.handleAccountTx = function (data)
{
  var self = this;

  var $scope = this.app.$scope;
  $scope.$apply(function () {
    if (data.transactions) {
      data.transactions.reverse().forEach(function (e) {
        self._processTxn(e.tx, e.meta, true);
      });
    }
  });
};

Model.prototype.handleAccountTxError = function (data)
{

};

Model.prototype.handleAccountEvent = function (e)
{
  this._processTxn(e.transaction, e.meta);
  var $scope = this.app.$scope;
  $scope.$digest();
};

/**
 * Process a transaction and add it to the history table.
 */
Model.prototype._processTxn = function (tx, meta, is_historic)
{
  var self = this;
  var $scope = this.app.$scope;

  var account = this.app.id.account;

  var processedTxn = rewriter.processTxn(tx, meta, account);

  if (processedTxn) {
    // Show status notification
    if (processedTxn.tx_result === "tesSUCCESS" &&
        processedTxn.type !== 'ignore' &&
        !is_historic) {
      this.app.sm.showTxNotification(processedTxn);
    }

    // Add to recent notifications
    if (processedTxn.tx_result === "tesSUCCESS" &&
        processedTxn.type !== 'ignore') {
      $scope.events.unshift(processedTxn);
    }

    // Add to payments history
    if (processedTxn.tx_type === "Payment" &&
        processedTxn.tx_result === "tesSUCCESS" &&
        processedTxn.type !== 'ignore') {
      $scope.history.unshift(processedTxn);
    }

    // Update Ripple lines
    if (processedTxn.lines && !is_historic) {
      this._updateLines(processedTxn);
    }

    // Update my offers
    if (processedTxn.offers && !is_historic) {
      processedTxn.offers.forEach(function (offer) {
        self._updateOffer(offer);
      });
    }
  }
};

/*
account: "rHMq44aXmd9wEYHK84VyiZyx8SP6VbpzNV"
balance: "0"
currency: "USD"
limit: "2000"
limit_peer: "0"
quality_in: 0
quality_out: 0
 */
Model.prototype._updateLines = function(txn)
{
  if (!$.isArray(txn.lines)) return;

  var self = this,
      $scope = this.app.$scope;

  $.each(txn.lines, function () {
    var txline = this,
        line = {},
        index = txline.counterparty + txline.currency;

    line.currency = txline.currency;
    line.account = txline.counterparty;

    if (txline.balance) {
      line.balance = txline.balance;
      self._updateRippleBalance(txline.currency,
                                txline.counterparty,
                                txline.balance);
    }

    if (txline.deleted) {
      delete $scope.lines[index];
      return;
    }

    if (txline.limit) {
      line.limit = txline.limit;
    }

    if (txline.limit_peer) {
      line.limit_peer = txline.limit_peer;
    }

    $scope.lines[index] = $.extend($scope.lines[index], line);
  });
};

Model.prototype._updateRippleBalance = function(currency, new_account, new_balance)
{
  var $scope = this.app.$scope;

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
};

Model.prototype._updateOffer = function (offer)
{
  var $scope = this.app.$scope;

  var reverseOrder = null;
  var pairs = $scope.pairs;
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].name;
    if (pair.slice(0,3) == offer.gets.currency().to_json() &&
        pair.slice(4,7) == offer.pays.currency().to_json()) {
      reverseOrder = false;
      break;
    } else if (pair.slice(0,3) == offer.pays.currency().to_json() &&
               pair.slice(4,7) == offer.gets.currency().to_json())  {
      reverseOrder = true;
      break;
    }
  }

  // TODO: Sensible default for undefined pairs
  if (reverseOrder === null) {
    reverseOrder = false;
  }

  if (reverseOrder) {
    offer.type = 'buy';
    offer.first = offer.pays;
    offer.second = offer.gets;
  } else {
    offer.type = 'sell';
    offer.first = offer.gets;
    offer.second = offer.pays;
  }

  if (!offer.deleted) {
    $scope.offers[""+offer.seq] = offer;
  } else {
    delete $scope.offers[""+offer.seq];
  }
};

exports.Model = Model;

