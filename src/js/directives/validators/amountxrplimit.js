var Currency = ripple.Currency;

angular
  .module('validators', [])
  .directive('rpAmountXrpLimit', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      // We don't use parseAmount here, assuming that you also use rpAmount validator
      var validator = function(value) {
        var currency = Currency.from_human(attr.rpAmountCurrency.slice(0, 3)).get_iso();

        if (currency !== 'XRP') {
          ctrl.$setValidity('rpAmountXrpLimit', true);
        } else {
          ctrl.$setValidity('rpAmountXrpLimit', value <= 100000000000 && value >= 0.000001);
        }

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});
