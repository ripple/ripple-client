var Currency = ripple.Currency;
/**
 * Maximum number of digits a user can send is 16
 */
angular
  .module('validators', [])
  .directive('rpMaxDigits', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      // We don't use parseAmount here, assuming that you also use rpAmount validator
      var validator = function(value) {
        var currency = Currency.from_human(attr.rpAmountCurrency.slice(0, 3)).get_iso();

        if (currency === 'XRP') {
          ctrl.$setValidity('rpMaxDigits', true);
        } else {
          var test = /^(?:(?=.{2,17}$)\d+\.\d+|\d{1,16})$/.test(value);

          // check for valid amount
          ctrl.$setValidity('rpMaxDigits', test);
        }

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpAmountCurrency', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
