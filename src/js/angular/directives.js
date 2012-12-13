/**
 * DIRECTIVES
 *
 * Miscellaneous directives go in this file.
 */

var module = angular.module('directives', []);

/**
 * Inline edit
 */
module.directive('inlineEdit', function () {
  var previewTemplate = '<span ng-hide="mode">{{model}}</span>';
  var editTemplate = '<input ng-show="mode" ng-model="model" />';

  return {
    restrict: 'E',
    scope: {
      model: '=',
      mode: '='
    },
    template: previewTemplate + editTemplate
  };
});

/*
 * Defines the rp-if tag. This removes/adds an element from the dom depending on a condition
 * Originally created by @tigbro, for the @jquery-mobile-angular-adapter
 * https://github.com/tigbro/jquery-mobile-angular-adapter
 */
module.directive('rpIf', [function () {
  return {
    transclude: 'element',
    priority: 1000,
    terminal: true,
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, iterStartElement, attr) {
        iterStartElement[0].doNotMove = true;
        var expression = attr.rpIf;
        var lastElement;
        var lastScope;
        scope.$watch(expression, function (newValue) {
          if (lastElement) {
            lastElement.remove();
            lastElement = null;
          }
          if (lastScope) {
            lastScope.$destroy();
            lastScope = null;
          }
          if (newValue) {
            lastScope = scope.$new();
            linker(lastScope, function (clone) {
              lastElement = clone;
              iterStartElement.after(clone);
            });
          }
          // Note: need to be parent() as jquery cannot trigger events on comments
          // (angular creates a comment node when using transclusion, as ng-repeat does).
          iterStartElement.parent().trigger("$childrenChanged");
        });
      };
    }
  };
}]);
