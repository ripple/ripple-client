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
  this.app.$scope.balance = "0";
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

  remote.on('account', this.handleAccountEvent.bind(this));

  var $scope = this.app.$scope;
  $scope.address = e.account;
};

Model.prototype.handleRippleLines = function (data)
{
  // XXX This is just temporary, we should aim for something cleaner
  var $scope = this.app.$scope;
  $scope.$apply(function () {
    $scope.lines = data.lines;
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
};

exports.Model = Model;
