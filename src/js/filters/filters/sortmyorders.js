var Amount = ripple.Amount;
/**
 * My Orders widget sorting filter.
 */
angular
  .module('filters', [])
  .filter('rpsortmyorders', function () {
  return function (items_object, field, reverse) {
    var arrayCopy = items_object.slice(0);
    arrayCopy.sort(function(a, b) {
      var res = 0;
      switch(field) {
        case 'qty':
          //res = a.first.compareTo(b.first);
          // Amount.compareTo doesn't compare XRP and non-XRP
          res = a.first.to_number() - b.first.to_number();
          break;
        case 'limit':
          var now = new Date();
          var ar = Amount.from_json(a.second).ratio_human(a.first, {reference_date: now});
          var br = Amount.from_json(b.second).ratio_human(b.first, {reference_date: now});
          //res = ar.compareTo(br);
          res = ar.to_number() - br.to_number();
          break;
        case 'type':
          res = a.type.localeCompare(b.type) ;
          break;
        case 'base':
          res = a.first.currency().to_json().localeCompare(b.first.currency().to_json());
          break;
        case 'counter':
          res = a.second.currency().to_json().localeCompare(b.second.currency().to_json());
          break;
        case 'time':
          break;
        default:
      }
      if (reverse) {
        res *= -1;
      }
      return res;
    });
    return arrayCopy;
  }
});
