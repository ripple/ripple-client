/**
 * Inbound Bridge profile
 *
 * This is the "InboundBridge" profile implementation
 */

var module = angular.module('integrationInboundBridge', []);

module.service('rpInboundBridgeProfile', ['$rootScope', 'rpNetwork', 'rpId',
  function($scope, network, id)
{
  this.inboundBridgeProfile = function(manifest) {
    return {
      trust: function () {

      }
    }
  };

  this.fromManifest = function (manifest) {
    return new this.inboundBridgeProfile(manifest);
  }
}]);