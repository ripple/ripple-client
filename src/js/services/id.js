/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a ripple.Remote instance.
 */

var module = angular.module('id', []);

module.factory('rpId', ['$location', '$route', '$routeParams',
                        function($location, $route, $routeParams) {
  var Id = function () {

  };

  // XXX: As we're switching to a cleaner "Angular-style" architecture, this file
  //      should become the place where login and identity authoritatively live.
  //      For now we'll inherit from the normal Id instance.
  Id.prototype = rippleclient.id;

  /**
   * Go to an identity page.
   *
   * Redirects the user to a page where they can identify. This could be the
   * login or register tab most likely.
   */
  Id.prototype.goId = function () {
    if (!this.isLoggedIn()) {
      if (_.size($routeParams)) {
        var tab = $route.current.$route.tabName;
        $location.search('tab', tab);
      }
      if (this.isReturning()) {
        $location.path('/login');
      } else {
        $location.path('/register');
      }
    }
  };

  return new Id();
}]);


