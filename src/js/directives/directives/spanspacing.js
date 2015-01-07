/**
 * Adds spacing around span tags.
 */
angular
  .module('directives', ['popup'])
  .directive('rpSpanSpacing', [function () {
  return {
    restrict: 'EA',
    compile: function (element, attr, linker) {
      element.find('> span').before(' ').after(' ');
    }
  };
}]);
