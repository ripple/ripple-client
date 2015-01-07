/**
 * Used to filter My Orders on trade tab.
 */
angular
  .module('filters', [])
  .filter('rpcurrentpair', function () {
  return function (items, doFilter, currentKey) {
    if (!doFilter) {
      return items;
    }

    return _.pick(items, function(order, okey, object) {
      var first_currency = order.first.currency();
      var first_issuer = order.first.issuer().to_json();
      var second_currency = order.second.currency();
      var second_issuer = order.second.issuer().to_json();

      var key = "" +
        first_currency.to_json() +
        (first_currency.is_native() ? "" : "/" + first_issuer) +
        ":" +
        second_currency._iso_code +
        (second_currency.is_native() ? "" : "/" + second_issuer);

      return key == currentKey;
    });
  }
});
