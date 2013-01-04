var util = require('util');
var webutil = require('../client/webutil');
var Tab = require('../client/tabmanager').Tab;
var Amount = ripple.Amount;

var TradeTab = function ()
{
  Tab.call(this);
};

util.inherits(TradeTab, Tab);
TradeTab.prototype.parent = 'advanced';

TradeTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/trade.jade')();
};

TradeTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['ledger']);

TradeTab.prototype.angular = function(module)
{
  var self = this;
  var app = this.app;

  module.controller('TradeCtrl', ['rpLedger', '$scope', function (ledger, $scope)
  {
    $scope.mode = "confirm";
    $scope.orders = [];

    var pairs = require('../data/pairs');
    $scope.pairs_query = webutil.queryFromOptions(pairs);

    $scope.reset = function () {
      if ($scope.orderForm) $scope.orderForm.$setPristine();
      $scope.mode = "trade";
      $scope.order = {
        type: 'buy',
        first: '',
        price: '',
        second: '',
        currency_pair: pairs[0].name,
        first_currency: pairs[0].name.slice(0, 3),
        second_currency: pairs[0].name.slice(4, 7)
      };
    };

    $scope.back = function () {
      $scope.mode = "trade";
    };

    $scope.place_order = function () {
      $scope.mode = "confirm";
      if ($scope.order.type === 'buy') {
        $scope.order.sell_amount = $scope.order.second_amount;
        $scope.order.buy_amount = $scope.order.first_amount;
      } else {
        $scope.order.sell_amount = $scope.order.first_amount;
        $scope.order.buy_amount = $scope.order.second_amount;
      }
    };

    $scope.cancel_order = function ()
    {
      var tx = app.net.remote.transaction();
      tx.offer_cancel(app.id.account, this.entry.seq);
      tx.on('success', function () {
      });
      tx.on('error', function () {
        $scope.mode = "error";
        $scope.$digest();
      });
      tx.submit();

      this.cancelled = true;
    };

    $scope.order_confirmed = function ()
    {
      var tx = app.net.remote.transaction();
      tx.offer_create(app.id.account, $scope.order.buy_amount, $scope.order.sell_amount);

      tx.on('success', function (res) {
        setEngineStatus(res, false);
        $scope.done(this.hash);
        $scope.$digest();
      });
      tx.on('error', function () {
        $scope.mode = "error";
        $scope.$digest();
      });
      tx.submit();

      $scope.mode = "sending";
    };

    $scope.done = function (hash)
    {
      console.log('done');
      $scope.mode = "done";
      app.net.remote.on('net_account', handleAccountEvent);

      function handleAccountEvent(e) {
        console.log('got event');
        if (e.transaction.hash === hash) {
          console.log('into hash');
          setEngineStatus(e, true);
          $scope.$digest();
          app.net.remote.removeListener('net_account', handleAccountEvent);
        }
      }
    }

    function setEngineStatus(res, accepted) {
      $scope.engine_result = res.engine_result;
      $scope.engine_result_message = res.engine_result_message;
      switch (res.engine_result.slice(0, 3)) {
        case 'tes':
          $scope.tx_result = accepted ? "cleared" : "pending";
          break;
        case 'tem':
          $scope.tx_result = "malformed";
          break;
        case 'ter':
          $scope.tx_result = "failed";
          break;
        case 'tep':
          console.warn("Unhandled engine status encountered!");
      }
    }

    $scope.$watch('order.currency_pair', function (pair) {
      $scope.order.first_currency = pair.slice(0, 3);
      $scope.order.second_currency = pair.slice(4, 7);

      if ($scope.order.type === "buy") {
        $scope.order.sell_currency = $scope.order.second_currency;
        $scope.order.buy_currency = $scope.order.first_currency;
      } else {
        $scope.order.sell_currency = $scope.order.first_currency;
        $scope.order.buy_currency = $scope.order.second_currency;
      }

      updateTicker();
     }, true);

    $scope.$watch('order.first', function (amount_str) {
      $scope.update_first();
     }, true);

    $scope.$watch('order.price', function (amount_str) {
      $scope.update_price();
    }, true);

    $scope.$watch('order.second', function (amount_str) {
      $scope.update_second();
    }, true);

    $scope.update_first = function () {
      var first_currency = $scope.order.first_currency || "XRP";
      var formatted = "" + $scope.order.first + " " + first_currency;

      $scope.order.first_amount = ripple.Amount.from_human(formatted);

      if (first_currency !== 'XRP') $scope.order.first_amount.set_issuer(app.id.account);
    };

    $scope.update_price = function () {
      var second_currency = $scope.order.second_currency || "XRP";
      var formatted = "" + $scope.order.price + " " + second_currency;

      $scope.order.price_amount = ripple.Amount.from_human(formatted);

      if (second_currency !== 'XRP') $scope.order.first_amount.set_issuer(app.id.account);
    };

    $scope.update_second = function () {
      var second_currency = $scope.order.second_currency ?
            $scope.order.second_currency.slice(0, 3).toUpperCase() : "XRP";
      var formatted = "" + $scope.order.second + " " + second_currency;

      $scope.order.second_amount = ripple.Amount.from_human(formatted);

      if (second_currency !== 'XRP') $scope.order.first_amount.set_issuer(app.id.account);
    };

    $scope.calc_second = function () {
      $scope.update_first();
      $scope.update_price();
      if ($scope.order.price_amount && $scope.order.price_amount.is_valid() &&
          $scope.order.first_amount && $scope.order.first_amount.is_valid()) {
        $scope.order.second_amount =
          $scope.order.price_amount.product_human($scope.order.first_amount);
        $scope.order.second = +$scope.order.second_amount.to_human({group_sep: false});
      }
    };

    $scope.calc_first = function () {
      $scope.update_second();
      $scope.update_price();
      if ($scope.order.price_amount  && $scope.order.price_amount.is_valid() &&
          $scope.order.second_amount && $scope.order.second_amount.is_valid()) {
        $scope.order.first_amount =
          $scope.order.second_amount.ratio_human($scope.order.price_amount);
        $scope.order.first = +$scope.order.first_amount.to_human({group_sep: false});
      }
    };

    function updateTicker() {
      $scope.bid_price = ripple.Amount.NaN();
      $scope.ask_price = ripple.Amount.NaN();
      $scope.spread = ripple.Amount.NaN();

      var secondCurrency = $scope.order.second_currency ?
            $scope.order.second_currency.slice(0, 3).toUpperCase() : "XRP";
      var firstCurrency = $scope.order.first_currency ?
            $scope.order.first_currency.slice(0, 3).toUpperCase() : "XRP";

      $scope.ticker_pair = secondCurrency + '/' + firstCurrency;

      var orders = ledger.getOrders(secondCurrency, firstCurrency);

      var bestBid = orders.bids[0];
      if (bestBid) $scope.bid_price = bestBid.o.amount.ratio_human(bestBid.i.amount);

      var bestAsk = orders.asks[0];
      if (bestAsk) $scope.ask_price = bestAsk.o.amount.ratio_human(bestAsk.i.amount);

      if ($scope.bid_price.is_valid() && $scope.ask_price.is_valid()) {
        $scope.spread = $scope.ask_price.add($scope.bid_price.negate());
      }
    }

    $scope.ledger = ledger;

    $scope.$watch('ledger.offers', function (offers) {
      updateTicker();
    }, true);

    $scope.reset();
  }]);
};




module.exports = TradeTab;
