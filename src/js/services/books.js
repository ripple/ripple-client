/**
 * BOOKS
 *
 * The books service is used to keep track of orderbooks.
 */

var module = angular.module('books', ['network']);

module.factory('rpBooks', ['rpNetwork', '$q', '$rootScope',
                           function (net, $q, $scope)
{
  function loadBook(gets, pays, taker) {
    return net.remote.book(gets.currency, gets.issuer,
                           pays.currency, pays.issuer,
                           taker);
  }

  return {
    get: function (first, second, taker)
    {
      var asks = loadBook(first, second, taker);
      var bids = loadBook(second, first, taker);

      var model = {
        asks: asks.offersSync(),
        bids: bids.offersSync()
      };

      function handleAskModel(offers) {
        model.asks = offers;
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
