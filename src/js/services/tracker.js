/**
 * Event tracker (analytics)
 */

var module = angular.module('tracker', []);

module.factory('rpTracker', ['$rootScope', function ($scope) {
  var track = function (event,properties) {
    if (Options.mixpanel && Options.mixpanel.track && window.mixpanel) {
      try {
        mixpanel.track(event,properties);
      } catch (ex) {
        // This probably means the browser is blocking us
        // or mixpanel is down
        console.log('Mixpanel tracking failed', ex);
      }
    }
  };

  return {
    track: track
  };
}]);
