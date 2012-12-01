var util = require('util');
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

//OrderBookTab.prototype.angular

OrderBookTab.prototype.angular = function(module)
{
  module.controller('OrderbookCtrl', function ($scope)
  {    
    $scope.changeNexus = function () 
    {
      
    };
    
    $scope.changePair =function()
    {
      //console.log("here");
      if($scope.buy_currency && $scope.sell_currency)
      { // TODO: need to fetch the ticker
        
      }
    }
  });
};

module.exports = OrderBookTab;