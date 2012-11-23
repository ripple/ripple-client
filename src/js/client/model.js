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

Model.prototype.handleAccountLoad = function (e) {
  var remote = this.app.net.remote;
  remote.request_ripple_lines_get(e.account)
    .on('success', this.handleRippleLines.bind(this)).request();
  remote.request_wallet_accounts(e.secret)
    .on('success', this.handleAccounts.bind(this)).request();
};

Model.prototype.handleRippleLines = function (data) {
  // XXX This is just temporary, we should aim for something cleaner
  var $scope = this.app.$scope;
  $scope.$apply(function () {
    $scope.lines = data.lines;
    console.log('Lines updated:', $scope.lines);
  });
};

Model.prototype.handleAccounts = function (data) {
  var $scope = this.app.$scope;
  $scope.$apply(function () {
    $scope.balance = data.accounts[0];
    console.log(data);
  });
};

exports.Model = Model;
