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
      $scope.mode = "trade";
      $scope.order_amount = '';
      $scope.order_price = '';
    };

    $scope.place_order = function () {
      $scope.sell_amount_feedback = ""+$scope.amount;
      $scope.sell_currency_feedback = $scope.sell_currency;
      $scope.buy_amount_feedback = $scope.amount*$scope.price;
      $scope.buy_currency_feedback = $scope.buy_currency;

      $scope.order = $scope.value;

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
      if($scope.buy_currency && $scope.sell_currency)
      { // TODO: need to fetch the ticker
        
      }
    };

    $scope.order_confirmed = function ()
    {
      var sell_currency = $scope.sell_currency.slice(0, 3).toUpperCase();
      var sell_issuer = webutil.findIssuer($scope.lines, sell_currency);
      var buy_currency = $scope.buy_currency.slice(0, 3).toUpperCase();
      var buy_issuer = webutil.findIssuer($scope.lines, buy_currency);

      // XXX: Needs to show an error
      if (!sell_issuer && sell_currency !== "XRP") return;
      if (!buy_issuer && buy_currency !== "XRP") return;

      var sell_amount = ripple.Amount.from_human(""+$scope.amount+" "+sell_currency);
      if (sell_issuer) sell_amount.set_issuer(sell_issuer);

      var buy_amount = ripple.Amount.from_human(""+$scope.value+" "+buy_currency);
      if (buy_issuer) buy_amount.set_issuer(buy_issuer);

      var tx = app.net.remote.transaction();
      tx.offer_create(app.id.account, buy_amount, sell_amount);

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

    $scope.update_value = function () {
      if ($scope.price) {
        $scope.value = +$scope.amount * $scope.price;
      }
    };

    $scope.update_amount = function () {
      if ($scope.price) {
        $scope.amount = +$scope.value / $scope.price;
      }
    };

    $scope.reset();
  });
};




module.exports = TradeTab;
