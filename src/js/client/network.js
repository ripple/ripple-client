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
  this.remote = new ripple.Remote(Options.server.trusted,
                                    Options.server.websocket_ip,
                                    Options.server.websocket_port,
                                    true);
};

exports.Network = Network;
