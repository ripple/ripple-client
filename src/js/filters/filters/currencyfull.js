var Amount = ripple.Amount;
/**
 * Get the full currency name from an Amount.
 */
angular
  .module('filters', [])
  .filter('rpcurrencyfull', ['$rootScope', function ($scope) {
  return function (input) {
    if (!input) return "";

    var amount = Amount.from_json(input);
    var currency = $.grep($scope.currencies_all, function(e){ return e.value == amount.currency().to_human(); })[0];

    if (currency) {
      return currency.name;
    } else {
      return amount.currency().to_human();
    }
  };
}]);
