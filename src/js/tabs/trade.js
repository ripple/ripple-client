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

TradeTab.prototype.angular = function(module)
{
  var self = this;
  var app = this.app;

  module.controller('TradeCtrl', function ($scope)
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

      tx.on('success', function () {
        $scope.reset();
        $scope.$digest();
      });
      tx.on('error', function () {
        $scope.mode = "error";
        $scope.$digest();
      });
      tx.submit();

      $scope.mode = "sending";
    };

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
    }, true);

    $scope.$watch('order.sell_currency', function (amount_str) {
      $scope.update_sell();
    }, true);

    $scope.update_sell = function () {
      var sell_currency = $scope.order.sell_currency ?
            $scope.order.sell_currency.slice(0, 3).toUpperCase() : "XRP";
      var sell_issuer = webutil.findIssuer($scope.lines, sell_currency);
      var formatted = "" + $scope.order.sell + " " + sell_currency.slice(0, 3);

      // XXX: Needs to show an error
      if (!sell_issuer && sell_currency !== "XRP") return;
      $scope.order.sell_amount = ripple.Amount.from_human(formatted);

      if (sell_issuer) $scope.order.sell_amount.set_issuer(sell_issuer);
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

    $scope.reset();
  });
};




module.exports = TradeTab;
