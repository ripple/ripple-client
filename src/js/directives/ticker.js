var module = angular.module('app');

/**
 * Ticker
 */
module.directive('rpTicker', function() {
  return {
    restrict: 'E',
    link: function() {
      var ticker = TickerWidget({
        url: API, // TODO not a good idea to have an API global variable
        id: "ticker"
      });

      ticker.load({
        markets: Options.ticker.markets
      });
    }
  };
});
