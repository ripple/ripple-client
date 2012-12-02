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
  module.controller('TradeCtrl', function ($scope)
  {
    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);
    
    $scope.reset = function () {
      $scope.mode = "trade";
      $scope.order_amount = '';
      $scope.order_price = '';
    };
    
    $scope.placeOrder = function () {
      var buy_amount = ripple.Amount.from_human(""+$scope.order_amount+" "+$scope.buy_currency);
      var sell_amount = ripple.Amount.from_human(""+$scope.order_amount+" "+$scope.sell_currency);
      
      $scope.sell_amount_feedback = sell_amount.to_human();
      $scope.sell_currency_feedback = sell_amount._currency.to_json();
      $scope.buy_amount_feedback = buy_amount.to_human();
      $scope.buy_currency_feedback = buy_amount._currency.to_json();
      
      $scope.mode = "confirm";
    };
    
    $scope.changePair =function()
    {
      //console.log("here");
      if($scope.buy_currency && $scope.sell_currency)
      { // TODO: need to fetch the ticker
        
      }
    }
    
    $scope.order_confirmed = function () 
    {
     /* var amount = ripple.Amount.from_human(""+$scope.amount);

      var tx = app.net.remote.transaction();
      tx.payment(app.id.account, $scope.recipient, amount.to_json());
      */
      //.offer_create("root", "500", "100/USD/root")
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

    $scope.reset();
    
    
  });
};


module.exports = TradeTab;