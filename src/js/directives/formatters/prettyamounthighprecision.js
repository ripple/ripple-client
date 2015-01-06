var RP_PRETTY_AMOUNT_DATE = 'rp-pretty-amount-date';

angular
  .module('formatters', ['domainalias'])
  .directive('rpPrettyAmountHighPrecision', [function () {
  return {
    restrict: 'EA',
    scope: {
      amount: '=rpPrettyAmountHighPrecision'
    },
    template: '<span class="value">{{amount | rpamount:{reference_date:date, abs_precision: 6} }}</span> ' +
              '<span class="currency" rp-currency="amount"></span>',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.date = scope.date || element.inheritedData(RP_PRETTY_AMOUNT_DATE);
      };
    }
  };
}]);
