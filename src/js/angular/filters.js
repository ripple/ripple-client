var module = angular.module('filters', []);
var Amount = ripple.Amount;

module.filter('rpamount', function () {
  return function (input, precision) {
    if (!precision) precision = 0;

    if (!input) return "n/a";

    var out = Amount.from_json(input).to_human({precision: 0});
    return out;
  };
});
