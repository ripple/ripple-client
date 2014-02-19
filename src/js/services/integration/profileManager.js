/**
 * Profile manager
 *
 * This service is used for managing profiles
 */

var module = angular.module('integrationProfileManager', [
  'integrationAccount'
]);

module.service('rpProfileManager', [
  '$rootScope',
  'rpAccountProfile',
  function(
    $scope,
    accountProfile
  )
{
  this.getProfile = function(name,manifest) {
    return eval(name + 'Profile.fromManifest(manifest)');
  };
}]);