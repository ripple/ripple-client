/**
 * EVENTS
 *
 * Angular-powered event handling directives go into this file.
 */

/**
 * Handle ENTER key press.
 */
angular
  .module('events', [])
  .directive('ngEnter', function() {
  return function(scope, elm, attrs) {
    elm.bind('keypress', function(e) {
      if (e.charCode === 13) scope.$apply(attrs.ngEnter);
    });
  };
});
