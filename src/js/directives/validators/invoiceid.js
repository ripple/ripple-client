/**
 * InvoiceID validator
 *
 * String must not be longer than 64 characters
 */
angular
  .module('validators', [])
  .directive('rpInvoiceId', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (!value || value.length <= 64) {
          ctrl.$setValidity('rpInvoiceId', true);
          return value;
        } else {
          ctrl.$setValidity('rpInvoiceId', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpInvoiceId', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
