var util = require('util'),
    events = require('events');

/**
 * Manage network state.
 *
 * This class is intended to manage the connection status to the
 * Ripple network.
 *
 * Note that code in other places *is allowed* to call the Ripple
 * library directly. This is not to be intended to be an abstraction
 * layer on top of an abstraction layer.
 */
var Network = function ()
{
  events.EventEmitter.call(this);

  this.remote = null;

  this.remote = new ripple.Remote(Options.server, true);
  this.remote.on('connected', this.handleConnect.bind(this));
};
util.inherits(Network, events.EventEmitter);

Network.prototype.init = function ()
{
  this.remote.connect();
};

Network.prototype.setApp = function (app)
{
  this.app = app;
};

/**
 * Setup listeners for identity state.
 *
 * This function causes the network object to start listening to
 * changes in the identity state and automatically subscribe to
 * accounts accordingly.
 */
Network.prototype.listenId = function (id)
{
  var self = this;

  id.on('accountload', function (e) {
    self.remote.set_secret(e.account, e.secret);
    self.remote.request_subscribe().accounts(e.account).request();
    self.remote.request_ripple_lines_get(e.account)
      .on('success', function (data) {
        // XXX This is just temporary, we should aim for something cleaner
        var $scope = self.app.$scope;
        $scope.$apply(function () {
          $scope.lines = data.lines;
          console.log('Lines updated:', $scope.lines);
        });
    }).request();
  });
};

Network.prototype.handleConnect = function ()
{
  this.emit('connect');
};

exports.Network = Network;
