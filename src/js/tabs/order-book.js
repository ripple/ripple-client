var util = require('util');
var webutil = require('../client/webutil');
var Tab = require('../client/tabmanager').Tab;

var OrderBookTab = function ()
{
  Tab.call(this);
  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(OrderBookTab, Tab);
OrderBookTab.prototype.parent = 'advanced';

OrderBookTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/order-book.jade')();
};

OrderBookTab.prototype.onAfterRender = function ()
{
  var app = this.app;
  app.net.remote.on("net_transaction", this.handleMsg.bind(this) );
};

OrderBookTab.prototype.angular = function(module)
{
  module.controller('OrderbookCtrl', function ($scope)
  {    
    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);
    
    $scope.query_dest = function (match) {
      return ['Alice','Antony','Bob','Charlie','Chandra'].filter(function (v) {
        return v.toLowerCase().match(match.toLowerCase());
      });
    };
    
    $scope.changeNexus = function () 
    {
      // need to stop listening to the previous nexus
      // need to start listening to this guy
      // need to ask for his current state
      
      
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
