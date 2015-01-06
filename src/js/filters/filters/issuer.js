var Amount = ripple.Amount;
/**
 * Get the currency issuer.
 */
angular
  .module('filters', [])
  .filter('rpissuer', function () {
  return function (input) {
    if (!input) return "";

    var amount = Amount.from_json(input);
    if (!amount.is_valid()) return "";
    if (!amount.issuer().is_valid()) return "";
    return amount.issuer().to_json();
  };
});
