/**
 * Email address validation
 */
angular
  .module('validators', [])
  .directive('rpEmail', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

      var validator = function(value) {
        ctrl.$setValidity('rpEmail', emailRegex.test(value));
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpEmail', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

