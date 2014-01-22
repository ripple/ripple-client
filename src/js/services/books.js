/**
 * BOOKS
 *
 * The books service is used to keep track of orderbooks.
 */

var module = angular.module('books', ['network']);
var Amount = ripple.Amount;


module.factory('rpBooks', ['rpNetwork', '$q', '$rootScope', '$filter', 'rpId',
function(net, $q, $scope, $filter, $id) {
  function loadBook(gets, pays, taker) {
    return net.remote.book(gets.currency, gets.issuer,
    pays.currency, pays.issuer,
    taker);
  }

  function filterRedundantPrices(data, action, combine) {
    var max_rows = Options.orderbook_max_rows || 100;

    var price;
    var lastprice;
    var current;
    var rpamount = $filter('rpamount');
    var numerator;
    var demoninator;
    var newData = jQuery.extend(true, {}, data);

    var rowCount = 0;
    newData = _.values(_.compact(_.map(newData, function(d, i) {

      // This check is redundant, but saves the CPU some work
      if (rowCount > max_rows) return false;

      // prefer taker_pays_funded & taker_gets_funded
      if (d.hasOwnProperty('taker_gets_funded')) {
        d.TakerGets = d.taker_gets_funded;
        d.TakerPays = d.taker_pays_funded;
      }

      d.TakerGets = Amount.from_json(d.TakerGets);
      d.TakerPays = Amount.from_json(d.TakerPays);

      d.price = Amount.from_quality(d.BookDirectory, "1", "1");

      if (action !== "asks") d.price = Amount.from_json("1/1/1").divide(d.price);

      // Adjust for drops: The result would be a million times too large.
      if (d[action === "asks" ? "TakerPays" : "TakerGets"].is_native())
        d.price  = d.price.divide(Amount.from_json("1000000"));

      // Adjust for drops: The result would be a million times too small.
      if (d[action === "asks" ? "TakerGets" : "TakerPays"].is_native())
        d.price  = d.price.multiply(Amount.from_json("1000000"));

      var price = rpamount(d.price, {
        rel_precision: 4,
        rel_min_precision: 2
      });

      // Don't combine current user's orders.
      if (d.Account == $id.account) {
        d.my = true;
      }

      if (lastprice === price && !d.my) {
        if (combine) {
          newData[current].TakerPays = Amount.from_json(newData[current].TakerPays).add(d.TakerPays);
          newData[current].TakerGets = Amount.from_json(newData[current].TakerGets).add(d.TakerGets);
        }
        d = false;
      } else current = i;

      if (!d.my)
        lastprice = price;

      if (d) rowCount++;

      if (rowCount > max_rows) return false;

      return d;
    })));

    var key = action === "asks" ? "TakerGets" : "TakerPays";
    var sum;
    _.each(newData, function (order, i) {
      if (sum) sum = order.sum = sum.add(order[key]);
      else sum = order.sum = order[key];
    });

    return newData;
  }

  return {
    get: function(first, second, taker) {
      var asks = loadBook(first, second, taker);
      var bids = loadBook(second, first, taker);

      var model = {
        asks: filterRedundantPrices(asks.offersSync(), 'asks', true),
        bids: filterRedundantPrices(bids.offersSync(), 'bids', true)
      };

      function handleAskModel(offers) {
        $scope.$apply(function () {
          model.asks = filterRedundantPrices(offers, 'asks', true);
        });
      }

      function handleAskTrade(gets, pays) {
        $scope.$apply(function () {
          model.last_price = gets.ratio_human(pays);
        });
      }
      asks.on('model', handleAskModel);
      asks.on('trade', handleAskTrade);

      function handleBidModel(offers) {
        $scope.$apply(function () {
          model.bids = filterRedundantPrices(offers, 'bids', true);
        });
      }

      function handleBidTrade(gets, pays) {
        $scope.$apply(function () {
          model.last_price = pays.ratio_human(gets);
        });
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
