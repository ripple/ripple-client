/**
 * Profile manager
 *
 * This service is used for managing profiles
 */

var module = angular.module('integrationProfileManager', [
  'integrationAccount',
  'integrationHistory',
  'integrationTrust',
  'integrationInboundBridge'
]);

module.service('rpProfileManager', [
  '$rootScope',
  'rpAccountProfile',
  'rpHistoryProfile',
  'rpTrustProfile',
  'rpInboundBridgeProfile',
  function(
    $scope,
    accountProfile,
    historyProfile,
    trustProfile,
    inboundBridgeProfile
  )
{
  this.getProfile = function(manifest) {
    var profiles = {
      'accountProfile': function() {return accountProfile.fromManifest(manifest);},
      'historyProfile': function() {return historyProfile.fromManifest(manifest);},
      'trustProfile': function() {return trustProfile.fromManifest(manifest);},
      'inboundBridgeProfile': function() {return inboundBridgeProfile.fromManifest(manifest);}
    };

    return profiles[manifest.type + 'Profile']();
  };
}]);
