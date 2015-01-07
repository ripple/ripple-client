/**
 * Show Ripple Name
 *
 * Shows a ripple name for a given ripple address
 */
angular
  .module('filters', [])
  .filter("rpripplename", ['$rootScope', '$http', 'rpId', function($scope, $http, $id) {
  return function(address, options) {
    var ripplename = $id.resolveNameSync(address, options);
    if (ripplename !== address) {
      return ripplename;
    }
    if (address.length > 21) {
      return address.substring(0, 7) + "…";
    }
    return address;
  }
}]);
