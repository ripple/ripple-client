var Amount = ripple.Amount;
/**
 * Calculate a ratio of two Amounts.
 */
angular
  .module('filters', [])
  .filter('rpamountratio', function () {
  return function (numerator, denominator) {
    try {
      return Amount.from_json(numerator).ratio_human(denominator, {reference_date: new Date()});
    } catch (err) {
      return Amount.NaN();
    }
  };
});
