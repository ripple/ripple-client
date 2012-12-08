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

    $scope.placeOrder = function () {
      $scope.sell_amount_feedback = ""+$scope.amount;
      $scope.sell_currency_feedback = $scope.sell_currency;
      $scope.buy_amount_feedback = $scope.amount*$scope.price;
      $scope.buy_currency_feedback = $scope.buy_currency;

      $scope.order = $scope.value;

      $scope.mode = "confirm";
    };

    $scope.changePair =function()
    {
      //console.log("here");
      if($scope.buy_currency && $scope.sell_currency)
      { // TODO: need to fetch the ticker
        
      }
    };

    $scope.order_confirmed = function () 
    {
      var sell_currency = $scope.sell_currency.slice(0, 3).toUpperCase();
      var buy_currency = $scope.buy_currency.slice(0, 3).toUpperCase();
      var buy_issuer = webutil.findIssuer($scope.lines,buy_currency);

      if (!buy_issuer) return;

      var sell_amount = ripple.Amount.from_human(""+$scope.amount+" "+sell_currency);
      //sell_amount.set_issuer();

      var buy_amount = ripple.Amount.from_human(""+$scope.value+" "+buy_currency);
      buy_amount.set_issuer(buy_issuer);

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
      $scope.value = +$scope.amount * $scope.price;
    };

    $scope.update_amount = function () {
      $scope.amount = +$scope.value / $scope.price;
    };

    $scope.reset();
  });
};




module.exports = TradeTab;
