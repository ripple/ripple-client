/**
 * BOOKS
 *
 * The books service is used to keep track of orderbooks.
 */

var module = angular.module('books', ['network']);
var Amount = ripple.Amount;

module.factory('rpBooks', ['rpNetwork', '$q', '$rootScope', '$filter',

function(net, $q, $scope, $filter) {
  function loadBook(gets, pays, taker) {
    return net.remote.book(gets.currency, gets.issuer,
    pays.currency, pays.issuer,
    taker);
  }

  function filterRedundantPrices(data, action, combine) {
    var price;
    var lastprice;
    var current;
    var rpamount = $filter('rpamount');
    var numerator;
    var demoninator;

    data = _.compact(_.map(data, function(d, i) {
      var numerator = (action == 'asks') ? d.TakerPays : d.TakerGets;
      var denominator = (action == 'asks') ? d.TakerGets : d.TakerPays;
      var price = rpamount(Amount.from_json(numerator).ratio_human(denominator), {
        rel_precision: 4,
        rel_min_precision: 2
      });

      if (lastprice == price) {
        if (combine) {
          if (action == 'asks') {
            data[current].TakerPays = Amount.from_json(data[current].TakerPays).add(d.TakerPays).to_number();
            data[current].TakerGets = Amount.from_json(data[current].TakerGets).add(d.TakerGets).to_json();
          } else {
            data[current].TakerPays = Amount.from_json(data[current].TakerPays).add(d.TakerPays).to_json();
            data[current].TakerGets = Amount.from_json(data[current].TakerGets).add(d.TakerGets).to_number();
          }
        }
        d = false;
      } else current = i;
      lastprice = price;

      return d;
    }));

    return data;
  }

  return {
    get: function(first, second, taker) {
      var asks = loadBook(first, second, taker);
      var bids = loadBook(second, first, taker);

      var model = {
        asks: filterRedundantPrices(asks.offersSync(), 'asks', false),
        bids: filterRedundantPrices(bids.offersSync(), 'bids', false)
      };

      function handleAskModel(offers) {
        model.asks = filterRedundantPrices(offers, 'asks', true);
        $scope.$digest();
      }

      function handleAskTrade(gets, pays) {
        model.last_price = gets.ratio_human(pays);
        $scope.$digest();
      }
      asks.on('model', handleAskModel);
      asks.on('trade', handleAskTrade);

      function handleBidModel(offers) {
        model.bids = filterRedundantPrices(offers, 'bids', true);
        $scope.$digest();
      }

      function handleBidTrade(gets, pays) {
        model.last_price = pays.ratio_human(gets);
        $scope.$digest();
      }
      bids.on('model', handleBidModel);
      bids.on('trade', handleBidTrade);

      model.unsubscribe = function() {
        asks.removeListener('model', handleAskModel);
        asks.removeListener('trade', handleAskTrade);
        bids.removeListener('model', handleBidModel);
        bids.removeListener('trade', handleBidTrade);
      };

      return model;
    }
  };
}]);