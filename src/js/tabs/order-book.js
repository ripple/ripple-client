var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tabmanager').Tab;

var OrderBookTab = function ()
{
  Tab.call(this);
};

util.inherits(OrderBookTab, Tab);
OrderBookTab.prototype.parent = 'advanced';

OrderBookTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/order-book.jade')();
};

OrderBookTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['ledger']);

OrderBookTab.prototype.angular = function(module)
{
  var app = this.app;

  module.controller('OrderbookCtrl', ['rpLedger', '$scope', '$rootScope',
                                      function (ledger, $scope, $rootScope)
  {
    $scope.$watch('buy_currency', function () {
      $scope.buy_currency_code = $scope.buy_currency ?
        $scope.buy_currency.slice(0, 3).toUpperCase() :
        "---";
    }, true);
    $scope.$watch('sell_currency', function () {
      $scope.sell_currency_code = $scope.sell_currency ?
        $scope.sell_currency.slice(0, 3).toUpperCase() :
        "---";
    }, true);

    $scope.$watch('currency_pair', function () {
      updateOfferList();
    }, true);

    function updateOfferList() {
      var buyCurrency  = $scope.currency_pair.slice(0,3);
      var sellCurrency = $scope.currency_pair.slice(4,7);

      var orders = ledger.getOrders(buyCurrency, sellCurrency);

      $scope.bids = orders.bids;
      $scope.asks = orders.asks;
    }

    var pairs = require('../data/pairs');
    $scope.pairs_query = webutil.queryFromOptions(pairs);

    $scope.currency_pair = pairs[0].name;

    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);

    $scope.ledger = ledger;

    $scope.$watch('ledger.offers', function (offers) {
      updateOfferList();
    }, true);
  }]);
};

module.exports = OrderBookTab;
