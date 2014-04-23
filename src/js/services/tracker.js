/**
 * Event tracker (analytics)
 */

var module = angular.module('tracker', []);

module.factory('rpTracker', ['$rootScope', function ($scope) {
  var track = function (event,properties) {
    console.log('track?',Options.mixpanel, Options.mixpanel.track, typeof mixpanel !== 'undefined');
    if (Options.mixpanel && Options.mixpanel.track && mixpanel) {
      console.log('track');
      mixpanel.track(event,properties);
    }
  };

  return {
    track: track
  };
}]);
