/**
 * Profile manager
 *
 * This service is used for managing profiles
 */

var module = angular.module('integrationProfileManager', [
  'integrationAccount',
  'integrationHistory'
]);

module.service('rpProfileManager', [
  '$rootScope',
  'rpAccountProfile',
  'rpHistoryProfile',
  function(
    $scope,
    accountProfile,
    historyProfile
  )
{
  this.getProfile = function(name,manifest) {
    var profiles = {
      'accountProfile': function(){return accountProfile.fromManifest(manifest)},
      'historyProfile': function(){return historyProfile.fromManifest(manifest)}
    };

    return profiles[name + 'Profile']();
  };
}]);