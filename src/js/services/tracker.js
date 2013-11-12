/**
 * Event tracker (analytics)
 */

var module = angular.module('tracker', []);

module.factory('rpTracker', ['$rootScope', function ($scope) {
  var track = function (event) {
    if (Options.mixpanel.track) {
      mixpanel.track(event);
    }
  };

  return {
    track: track
  };
}]);
