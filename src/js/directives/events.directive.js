/**
 * EVENTS
 *
 * Angular-powered event handling directives go into this file.
 */

var module = angular.module('events', []);

/**
 * Handle ENTER key press.
 */
module.directive('ngEnter', function() {
  return function(scope, elm, attrs) {
    elm.bind('keypress', function(e) {
      if (e.charCode === 13) scope.$apply(attrs.ngEnter);
    });
  };
});
