var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var FeedTab = function ()
{
  Tab.call(this);
  
  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(FeedTab, Tab);
FeedTab.prototype.parent = 'advanced';

FeedTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/feed.jade')();
};

FeedTab.prototype.onAfterRender = function ()
{
  var app = this.app;
  app.net.remote.on("net_transaction", this.handleMsg.bind(this) );
  app.net.remote.on("net_ledger", this.handleMsg.bind(this) );
  app.net.remote.on("net_server", this.handleMsg.bind(this) );
};

FeedTab.prototype.angular = function (module)
{
  var app = this.app;
  module.controller('FeedCtrl', function ($scope)
  { 
    $scope.toggle_feed_transactions = function () 
    {
      console.log($scope.transCheck);
      if($scope.transCheck)
        app.net.remote.request_subscribe("transactions").request();
      else app.net.remote.request_unsubscribe("transactions").request();
    };
    $scope.toggle_feed_server = function () 
    {
      if($scope.serverCheck)
        app.net.remote.request_subscribe("server").request();
      else app.net.remote.request_unsubscribe("server").request();
    };
    $scope.clear_feed = function () 
    {
    }; 
  });
};

FeedTab.prototype.handleMsg = function(message)
{
  console.log(message);
  if(message.type=="net_transaction" && $scope.transCheck)
  {
    
  }else if(message.type=="net_ledger" && $scope.ledgerCheck)
  {
    
  }else if(message.type=="net_server" && $scope.serverCheck)
  {
    
  }
}



module.exports = FeedTab;