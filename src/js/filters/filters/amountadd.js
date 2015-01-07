var Amount = ripple.Amount;
/**
 * Calculate the sum of two Amounts.
 */
angular
  .module('filters', [])
  .filter('rpamountadd', function () {
  return function (a, b) {
    try {
      b = Amount.from_json(b);
      if (b.is_zero()) return a;
      return Amount.from_json(a).add(b);
    } catch (err) {
      return Amount.NaN();
    }
  };
});
