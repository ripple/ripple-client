var util = require('util'),
    events = require('events'),
    rewriter = require('./jsonrewriter');

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

  $scope.balance = "0";

  $scope.currencies_all = require('../data/currencies');
  $scope.currencies = $scope.currencies_all.slice(1);
};

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
  id.on('accountload', this.handleAccountLoad.bind(this));
};

Model.prototype.handleAccountLoad = function (e)
{
  var remote = this.app.net.remote;
  remote.request_ripple_lines_get(e.account)
    .on('success', this.handleRippleLines.bind(this)).request();
  remote.request_wallet_accounts(e.secret)
    .on('success', this.handleAccounts.bind(this)).request();

  remote.on('net_account', this.handleAccountEvent.bind(this));

  var $scope = this.app.$scope;
  $scope.address = e.account;
};

Model.prototype.handleRippleLines = function (data)
{
  var $scope = this.app.$scope;
  $scope.$apply(function () 
  {
    $scope.lines={};
    for(var n=0; n<data.lines.length; n++)
    {
      $scope.lines[data.lines[n].account+data.lines[n].currency] = data.lines[n];
    }
    console.log('Lines updated:', $scope.lines);
  });
};

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

Model.prototype.handleAccountTx = function (account, data)
{
  var self = this;

  var $scope = this.app.$scope;
  $scope.$apply(function () {
    $scope.history = [];
    if (data.transactions) {
      var transactions = data.transactions.forEach(function (e) {
        self._processTxn(e.tx, e.meta);
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
Model.prototype._processTxn = function (tx, meta)
{
  var $scope = this.app.$scope;

  var account = this.app.id.account;

  var historyEntry = rewriter.processTxn(tx, meta, account);

  $scope.history.unshift(historyEntry);
  
  if(tx.TransactionType === "TrustSet" ) this._updateLines(meta,account);
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
Model.prototype._updateLines= function(meta,account)
{
  var $scope = this.app.$scope;

  var nodes = rewriter.filterAnodes(meta.AffectedNodes, "RippleState");
  for (var i=0, l=nodes.length; i<l; i++) {
    var fields = rewriter.getAnodeResult(nodes[i]),
        currency = fields.Balance.currency,
        peer_account, index;

    var line = {};

    if (fields.HighLimit.issuer===account) {
      peer_account = fields.LowLimit.issuer;
      line.limit = fields.HighLimit.value;
      line.limit_peer = fields.LowLimit.value;
    } else if (fields.LowLimit.issuer===account) {
      peer_account = fields.HighLimit.issuer;
      line.limit = fields.LowLimit.value;
      line.limit_peer = fields.HighLimit.value;
    }
    line.balance = fields.Balance.value;

    index = peer_account+currency;

    $scope.lines[index] = $.extend($scope.lines[index], line);
  }
}

exports.Model = Model;
