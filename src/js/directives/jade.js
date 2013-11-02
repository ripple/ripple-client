/**
 * JADE DIRECTIVES
 *
 */

var module = angular.module('jade', []);

/**
 * Jade Replace
 */
module.directive('rpJadeReplace', ['$rootScope', '$compile', function($rootScope, $compile) {
  return {
    restrict: 'A',
    scope: false,
    link: function(scope, element, attrs) {
      scope = {parent: scope.$parent, root: $rootScope}[attrs.scope] || scope;
      template = require("../../jade/" +  attrs.rpJadeReplace)();
      $compile(template)(scope, function (el, $scope) {
        element.replaceWith(el);
      });
    }
  };
}]);
