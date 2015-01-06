angular
  .module('validators', [])
  .directive('rpAmountPositive', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      // We don't use parseAmount here, assuming that you also use rpAmount validator
      var validator = function(value) {
        // check for positive amount
        ctrl.$setValidity('rpAmountPositive', value > 0);

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});
