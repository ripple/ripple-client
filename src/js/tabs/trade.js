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
    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);

    $scope.reset = function () {
      if ($scope.orderForm) $scope.orderForm.$setPristine();
      $scope.mode = "trade";
      $scope.order = {
        sell: '',
        price: '',
        buy: '',
        sell_currency: $scope.currencies_all[0].name,
        buy_currency: ''
      };
    };

    $scope.back = function () {
      $scope.mode = "trade";
    };

    $scope.place_order = function () {
      $scope.mode = "confirm";
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

    $scope.change_pair = function ()
    {
      //console.log("here");
      if($scope.order.buy_currency && $scope.order.sell_currency)
      { // TODO: need to fetch the ticker

      }
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

    $scope.$watch('order.sell', function (amount_str) {
      $scope.update_sell();
     }, true);

    $scope.$watch('order.price', function (amount_str) {
      $scope.update_price();
    }, true);

    $scope.$watch('order.buy', function (amount_str) {
      $scope.update_buy();
    }, true);

    $scope.$watch('order.buy_currency', function (amount_str) {
      $scope.update_buy();
      $scope.update_price();
      updateTicker();
    }, true);

    $scope.$watch('order.sell_currency', function (amount_str) {
      $scope.update_sell();
      updateTicker();
    }, true);

    $scope.update_sell = function () {
      var sell_currency = $scope.order.sell_currency ?
            $scope.order.sell_currency.slice(0, 3).toUpperCase() : "XRP";
      var formatted = "" + $scope.order.sell + " " + sell_currency.slice(0, 3);

      $scope.order.sell_amount = ripple.Amount.from_human(formatted);

      if (sell_currency !== 'XRP') $scope.order.sell_amount.set_issuer(app.id.account);
    };

    $scope.update_price = function () {
      var buy_currency = $scope.order.buy_currency ?
            $scope.order.buy_currency.slice(0, 3).toUpperCase() : "XRP";
      var buy_issuer = webutil.findIssuer($scope.lines, buy_currency);
      var formatted = "" + $scope.order.price + " " + buy_currency;

      if (!buy_issuer && buy_currency !== "XRP") return;
      $scope.order.price_amount = ripple.Amount.from_human(formatted);

      if (buy_issuer) $scope.order.price_amount.set_issuer(buy_issuer);
    };

    $scope.update_buy = function () {
      var buy_currency = $scope.order.buy_currency ?
            $scope.order.buy_currency.slice(0, 3).toUpperCase() : "XRP";
      var buy_issuer = webutil.findIssuer($scope.lines, buy_currency);
      var formatted = "" + $scope.order.buy + " " + buy_currency;

      if (!buy_issuer && buy_currency !== "XRP") return;
      $scope.order.buy_amount = ripple.Amount.from_human(formatted);

      if (buy_issuer) $scope.order.buy_amount.set_issuer(buy_issuer);
    };

    $scope.calc_buy = function () {
      $scope.update_sell();
      $scope.update_price();
      if ($scope.order.price_amount && $scope.order.price_amount.is_valid() &&
          $scope.order.sell_amount  && $scope.order.sell_amount.is_valid()) {
        $scope.order.buy_amount =
          $scope.order.price_amount.product_human($scope.order.sell_amount);
        $scope.order.buy = +$scope.order.buy_amount.to_human({group_sep: false});
      }
    };

    $scope.calc_sell = function () {
      $scope.update_buy();
      $scope.update_price();
      if ($scope.order.price_amount && $scope.order.price_amount.is_valid() &&
          $scope.order.buy_amount   && $scope.order.buy_amount.is_valid()) {
        $scope.order.sell_amount =
          $scope.order.buy_amount.ratio_human($scope.order.price_amount);
        $scope.order.sell = +$scope.order.sell_amount.to_human({group_sep: false});
      }
    };

    function updateTicker() {
      $scope.bid_price = ripple.Amount.NaN();
      $scope.ask_price = ripple.Amount.NaN();
      $scope.spread = ripple.Amount.NaN();

      var buyCurrency = $scope.order.buy_currency ?
            $scope.order.buy_currency.slice(0, 3).toUpperCase() : "XRP";
      var sellCurrency = $scope.order.sell_currency ?
            $scope.order.sell_currency.slice(0, 3).toUpperCase() : "XRP";

      $scope.ticker_pair = buyCurrency + '/' + sellCurrency;

      var orders = ledger.getOrders(buyCurrency, sellCurrency);

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
