var Amount = ripple.Amount;
/**
 * Calculate the difference of two Amounts.
 */
angular
  .module('filters', [])
  .filter('rpamountsubtract', function () {
  return function (a, b) {
    try {
      return Amount.from_json(a).subtract(b);
    } catch (err) {
      return Amount.NaN();
    }
  };
});
