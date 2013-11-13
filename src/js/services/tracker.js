/**
 * Event tracker (analytics)
 */

var module = angular.module('tracker', []);

module.factory('rpTracker', ['$rootScope', function ($scope) {
  var track = function (event,properties) {
    if (Options.mixpanel && Options.mixpanel.track) {
      mixpanel.track(event,properties);
    }
  };

  return {
    track: track
  };
}]);
