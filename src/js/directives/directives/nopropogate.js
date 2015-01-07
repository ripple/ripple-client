angular
  .module('directives', ['popup'])
  .directive('rpNoPropagate', [function() {
  return {
    restrict: 'A',
    link: function($scope, element, attr) {
      element.click(function(e) {
        e.stopPropagation();
      });
    }
  };
}]);
