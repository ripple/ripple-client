var util = require('util'),
    events = require('events');

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
    $scope.balance = data.accounts[0];

    remote.request_account_tx(data.accounts[0].Account, "0", "999999")
      .on('success', self.handleAccountTx.bind(self, data.accounts[0].Account)).request();
  });
};

Model.prototype.handleAccountTx = function (account, data)
{
  var $scope = this.app.$scope;
  $scope.$apply(function () {
    var transactions = data.transactions.map(function (e) {
      var historyEntry = {};
      historyEntry.fee = e.Fee;
      switch (e.TransactionType) {
      case 'Payment':
        historyEntry.type = e.Account === account ?
          'sent' :
          'received';
        historyEntry.counterparty = e.Account === account ?
          e.Destination :
          e.Account;
        historyEntry.amount = e.Amount;
        historyEntry.currency = "XRP";
        break;
      case 'TrustSet':
        historyEntry.type = 'other';
        historyEntry.counterparty = e.Account === account ?
          e.LimitAmount.issuer :
          e.Account;
        return null;
      default:
        console.log('Unknown transaction type: "'+e.TransactionType+'"', e);
        return null;
      }
      return historyEntry;
    });
    $scope.history = transactions.filter(function (e) {
      return e !== null;
    });
  });
};

exports.Model = Model;
