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
  this.remote = null;
};

Network.prototype.init = function ()
{
  this.remote = new ripple.Remote(Options.server,
                                  true);
  this.remote.connect();
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
    self.remote.request_subscribe().rtaccounts(e.account).request();
    self.remote.request_ripple_lines_get(e.account).on('success', function () {
      console.log(arguments);
    }).request();
  });
};

exports.Network = Network;
