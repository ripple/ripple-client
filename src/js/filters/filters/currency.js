var Currency = ripple.Currency;
var Amount = ripple.Amount;
/**
 * Get the currency from an Amount or Currency object.
 *
 * If the input is neither an Amount or Currency object it will be passed to
 * Amount#from_json to try to interpret it.
 */
angular
  .module('filters', [])
  .filter('rpcurrency', function () {
  return function (input) {
    if (!input) return "";

    var currency;
    if (input instanceof Currency) {
      currency = input;
    } else {
      var amount = Amount.from_json(input);
      currency = amount.currency();
    }

    return currency.to_human();
  };
});
