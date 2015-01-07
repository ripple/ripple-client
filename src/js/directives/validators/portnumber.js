/**
 * Port number validator
 */
angular
  .module('validators', [])
  .directive('rpPortNumber', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        ctrl.$setValidity('rpPortNumber', (parseInt(value,10) == value && value >= 1 && value <= 65535));
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpPortNumber', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
