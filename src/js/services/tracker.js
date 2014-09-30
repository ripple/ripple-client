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

  var trackError = function (eventName, errorObject, additionalProperties) {
    if (errorObject && 'object' === typeof errorObject) {
      errorObject = {
        Name: errorObject.name,
        Message: errorObject.message,
        Stack: errorObject.stack
      };
    } else {
      errorObject = {
        Name: 'NonErrorThrownValue',
        Message: 'Not an Error object: ' + errorObject,
        Stack: ''
      };
    }

    if (additionalProperties) {
      angular.extend(errorObject, additionalProperties);
    }

    track(eventName, errorObject);
  };

  return {
    track: track,
    trackError: trackError
  };
}]);
