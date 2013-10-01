/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a ripple.Remote instance.
 */

var module = angular.module('network', []);

module.factory('rpNetwork', ['$rootScope', function($scope)
{
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
    this.remote = new ripple.Remote(Options.server, true);
    this.remote.on('connected', this.handleConnect.bind(this));
    this.remote.on('disconnected', this.handleDisconnect.bind(this));

    this.connected = false;
  };

  Network.prototype.init = function ()
  {
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
  };

  Network.prototype.handleConnect = function (e)
  {
    var self = this;
    $scope.$apply(function () {
      self.connected = true;
      $scope.connected = true;
      $scope.$broadcast('$netConnected');
    });
  };

  Network.prototype.handleDisconnect = function (e)
  {
    var self = this;
    $scope.$apply(function () {
      self.connected = false;
      $scope.connected = false;
      $scope.$broadcast('$netDisconnected');
    });
  };

  return new Network();
}]);

