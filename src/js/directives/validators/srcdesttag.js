/**
 * Source and destination tags validator
 *
 * Integer in the range 0 to 2^32-1
 */
angular
  .module('validators', [])
  .directive('rpStdt', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (!value || (!isNaN(parseFloat(value)) && isFinite(value) && value >= 0 && value < Math.pow(2,32) - 1)) {
          ctrl.$setValidity('rpStdt', true);
          return value;
        } else {
          ctrl.$setValidity('rpStdt', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpStdt', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
