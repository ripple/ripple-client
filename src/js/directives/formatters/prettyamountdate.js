var RP_PRETTY_AMOUNT_DATE = 'rp-pretty-amount-date';

/**
 * Set the reference date for rpPrettyAmount.
 *
 * You can set this on the same element that uses rpPrettyAmount or on any
 * parent element.
 *
 * The reference date is used to calculate demurrage/interest correctly.
 */
angular
  .module('formatters', ['domainalias'])
  .directive('rpPrettyAmountDate', [function () {
  return {
    restrict: 'EA',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        element.data(RP_PRETTY_AMOUNT_DATE, scope.$eval(attr.rpPrettyAmountDate));
      };
    }
  };
}]);
