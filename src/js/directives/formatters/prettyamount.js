var RP_PRETTY_AMOUNT_DATE = 'rp-pretty-amount-date';

angular
  .module('formatters', ['domainalias'])
  .directive('rpPrettyAmount', [function () {
  return {
    restrict: 'EA',
    scope: {
      amount: '=rpPrettyAmount'
    },
    template: '<span class="value">{{amount | rpamount:{reference_date:date} }}</span> ' +
              '<span class="currency" rp-currency="amount"></span>',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.date = scope.date || element.inheritedData(RP_PRETTY_AMOUNT_DATE);
      };
    }
  };
}]);
