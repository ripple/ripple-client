/**
 * Profile manager
 *
 * This service is used for managing profiles
 */

var module = angular.module('integrationProfileManager', [
  'integrationAccount',
  'integrationHistory',
  'integrationTrust'
]);

module.service('rpProfileManager', [
  '$rootScope',
  'rpAccountProfile',
  'rpHistoryProfile',
  'rpTrustProfile',
  function(
    $scope,
    accountProfile,
    historyProfile,
    trustProfile
  )
{
  this.getProfile = function(name,manifest) {
    var profiles = {
      'accountProfile': function(){return accountProfile.fromManifest(manifest)},
      'historyProfile': function(){return historyProfile.fromManifest(manifest)},
      'trustProfile': function(){return trustProfile.fromManifest(manifest)}
    };

    return profiles[name + 'Profile']();
  };
}]);