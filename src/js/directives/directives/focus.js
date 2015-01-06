/**
 * Focus element on render
 */
angular
  .module('directives', ['popup'])
  .directive('rpFocus', ['$timeout', function($timeout) {
  return function($scope, element) {
    $timeout(function() {
      $scope.$watch(function() {return element.is(':visible');}, function(newValue) {
        if (newValue === true)
          element.focus();
      });
    });
  };
}]);
