/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a ripple.Remote instance.
 */

var module = angular.module('network', []);

module.factory('rpNetwork', [function() {
  // XXX: As we're switching to a cleaner "Angular-style" architecture, this file
  //      should become the place where the ripple.Remote instance authoritatively
  //      lives. At that point we won't need the App class at all anymore,
  //      dependency injection will take over its job.
  return rippleclient.net;
}]);


