/**
 * BOOKS
 *
 * The books service is used to keep track of orderbooks.
 */

var module = angular.module('books', ['network']);
var Amount = ripple.Amount;

module.factory('rpBooks', ['rpNetwork', '$q', '$rootScope', '$filter',
                           function (net, $q, $scope, $filter)
{
  function loadBook(gets, pays, taker) {
    return net.remote.book(gets.currency, gets.issuer,
                           pays.currency, pays.issuer,
                           taker);
  }

   function filterRedundantPrices(data, combine) {
      var price;
      var lastprice;
      var current;
      var rpamount = $filter('rpamount');

      data = _.compact(_.map(data, function(d, i){
        price = rpamount(Amount.from_json(d.TakerPays).ratio_human(d.TakerGets), {rel_precision: 4, rel_min_precision: 2} );
        if (lastprice == price) {
          if (combine) {
            data[current].TakerPays = Amount.from_json(data[current].TakerPays).add(d.TakerPays).to_number();
            data[current].TakerGets = Amount.from_json(data[current].TakerGets).add(d.TakerGets).to_json();
          }
          d = false;
        } else {
          current = i;
        }
        lastprice = price;

        return d;
      }));
      filtered = true;

      return data;
    }

  return {
    get: function (first, second, taker)
    {
      var asks = loadBook(first, second, taker);
      var bids = loadBook(second, first, taker);

      var model = {
        asks: filterRedundantPrices(asks.offersSync(), false),
        bids: bids.offersSync()
      };

      function handleAskModel(offers) {
        model.asks = filterRedundantPrices(offers, true);
        $scope.$digest();
      }
      function handleAskTrade(gets, pays) {
        model.last_price = gets.ratio_human(pays);
        $scope.$digest();
      }
      asks.on('model', handleAskModel);
      asks.on('trade', handleAskTrade);

      function handleBidModel(offers) {
        model.bids = offers;
        $scope.$digest();
      }
      function handleBidTrade(gets, pays) {
        model.last_price = pays.ratio_human(gets);
        $scope.$digest();
      }
      bids.on('model', handleBidModel);
      bids.on('trade', handleBidTrade);

      model.unsubscribe = function () {
        asks.removeListener('model', handleAskModel);
        asks.removeListener('trade', handleAskTrade);
        bids.removeListener('model', handleBidModel);
        bids.removeListener('trade', handleBidTrade);
      };

      return model;
    }
  };
}]);
