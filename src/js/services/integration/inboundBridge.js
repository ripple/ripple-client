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
      type: manifest.type,
      version: manifest.version,
      bridgeType: manifest.bridgeType,
      currencies: manifest.currencies,

      trust: function () {

      }
    }
  };

  this.fromManifest = function (manifest) {
    return new this.inboundBridgeProfile(manifest);
  }
}]);