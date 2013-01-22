var util = require('util'),
    events = require('events'),
    rewriter = require('../util/jsonrewriter');

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
  var $scope = this.app.$scope;

  this.reset();

  $scope.currencies_all = require('../data/currencies');
  $scope.currencies = $scope.currencies_all.slice(1);
  $scope.pairs = require('../data/pairs');

  this.app.id.on('accountload', this.handleAccountLoad.bind(this));
  this.app.net.remote.on('account', this.handleAccountEvent.bind(this));
};

Model.prototype.reset = function ()
{
  var $scope = this.app.$scope;

  $scope.balance = "0";

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

  remote.request_account_lines(e.account)
    .on('success', this.handleRippleLines.bind(this))
    .on('error', this.handleRippleLinesError.bind(this)).request();
  remote.request_wallet_accounts(e.secret)
    .on('success', this.handleAccounts.bind(this))
    .on('error', this.handleAccountsError.bind(this)).request();
  remote.request_account_offers(e.account)
    .on('success', this.handleOffers.bind(this))
    .on('error', this.handleOffersError.bind(this)).request();

  $scope.address = e.account;

  if(!$scope.$$phase) {
    $scope.$digest();
  }
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

Model.prototype.handleAccounts = function (data)
{
  var self = this;
  var remote = this.app.net.remote;
  var $scope = this.app.$scope;
  $scope.$apply(function () {
    $scope.balance = data.accounts[0].Balance;

    remote.request_account_tx(data.accounts[0].Account, "0", "999999")
      .on('success', self.handleAccountTx.bind(self, data.accounts[0].Account)).request();
  });
};

Model.prototype.handleAccountsError = function (data)
{
}

Model.prototype.handleAccountTx = function (account, data)
{
  var self = this;

  var $scope = this.app.$scope;
  $scope.$apply(function () {
    if (data.transactions) {
      data.transactions.forEach(function (e) {
        self._processTxn(e.tx, e.meta, true);
      });
    }
  });
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
    // Add to recent notifications
    if (processedTxn.tx_result === "tesSUCCESS") {
      $scope.events.unshift(processedTxn);
    }

    // Add to payments history
    if (processedTxn.tx_type === "Payment" &&
        processedTxn.tx_result === "tesSUCCESS") {
      $scope.history.unshift(processedTxn);
    }

    // Update XRP balance
    if (processedTxn.xrp_balance && !is_historic) {
      $scope.balance = processedTxn.xrp_balance;
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
    $scope.balances[currency] = {components: {}, highest: null, total: null};
  }

  var balance = $scope.balances[currency];

  if (new_account) {
    balance.components[new_account] = new_balance;
  }

  balance.total = null; balance.highest = null;
  for (var counterparty in balance.components) {
    var amount = balance.components[counterparty];

    balance.total = balance.total ? balance.total.add(amount) : amount;
    if (!balance.highest || balance.highest.compareTo(amount) === -1) {
      balance.highest = amount;
      balance.highest_issuer = counterparty;
    }
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

