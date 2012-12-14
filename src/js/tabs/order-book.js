var util = require('util');
var webutil = require('../client/webutil');
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

OrderBookTab.prototype.angular = function(module)
{
  var app = this.app;

  module.controller('OrderbookCtrl', function ($scope)
  {
    app.net.remote.request_ledger("ledger_closed", "full")
      .on('success', handleLedger)
      .request();

    var offers = [];
    function handleLedger(e)
    {
      offers = e.ledger.accountState.filter(function (node) {
        return node.LedgerEntryType === "Offer";
      });
      updateOfferList();
    }

    function updateOfferList() {
      $scope.asks = [];
      $scope.bids = [];

      var buyCurrency  = $scope.currency_pair.slice(0,3);
      var sellCurrency = $scope.currency_pair.slice(4,7);

      offers.forEach(function (node) {
        var gets = rewriteAmount(node.TakerGets);
        var pays = rewriteAmount(node.TakerPays);

        if (buyCurrency === gets.currency && sellCurrency === pays.currency) {
          $scope.asks.push({i: gets, o: pays});
        }

        if (buyCurrency === pays.currency && sellCurrency === gets.currency) {
          $scope.bids.push({i: pays, o: gets});
        }
      });

      $scope.asks.sort(function (a, b) {
        return (a.i.num/a.o.num) - (b.i.num/b.o.num);
      });

      $scope.bids.sort(function (a, b) {
        return (b.o.num/b.i.num) - (a.o.num/a.i.num);
      });

      fillSum($scope.asks, 'o');
      fillSum($scope.bids, 'i');
    }

    function rewriteAmount(amountJson) {
      var amount = ripple.Amount.from_json(amountJson);
      return {
        amount: amount,
        // Pretty dirty hack, but to_text for native values gives 1m * value...
        // In the future we will likely remove this field altogether (and use
        // Amount class math instead), so it's ok.
        num: +amount.to_human({group_sep: false}),
        currency: amount.currency().to_json(),
        issuer: amount.issuer().to_json()
      };
    }

    /**
     * Fill out the sum field in the bid or ask orders array.
     */
    function fillSum(array) {
      var sum = 0;
      for (var i = 0, l = array.length; i<l; i++) {
        sum += array[i].o.num;
        array[i].sum = sum;
      }
    }

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

    var pairs = require('../data/pairs');
    $scope.pairs_query = webutil.queryFromOptions(pairs);

    $scope.currency_pair = pairs[0].name;

    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);
  });
};

module.exports = OrderBookTab;
