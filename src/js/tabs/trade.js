var util = require('util');
var Tab = require('../client/tabmanager').Tab;

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

TradeTab.prototype.angular = function (module) 
{
  module.controller('TradeCtrl', function ($scope)
  {
    $scope.placeOrder = function () {
      var buy_amount = ripple.Amount.from_human(""+$scope.order_amount+" "+$scope.buy_currency);
      var sell_amount = ripple.Amount.from_human(""+$scope.order_amount+" "+$scope.sell_currency);

      
    };
  });
};


module.exports = TradeTab;