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
  //app.net.remote.on("net_transaction", this.handleMsg.bind(this) );
 // app.net.remote.on("ledger_close", this.handleMsg.bind(this) );
//  app.net.remote.on("net_server", this.handleMsg.bind(this) );
};

FeedTab.prototype.angular = function (module)
{
  var app = this.app;
  
  module.controller('FeedCtrl', function ($scope)
  { 
    $scope.feed=[];
    
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
      $scope.feed=[];
    }; 
  });
};

FeedTab.prototype.handleMsg = function(message)
{
  console.log(message);
  message.date="hello";
  if(message.type=="transaction" && $scope.transCheck)
  {
    $scope.feed.unshift(message);
  }else if(message.type=="ledgerClose" && $scope.ledgerCheck)
  {
    $scope.feed.unshift(message);
  }else if(message.type=="net_server" && $scope.serverCheck)
  {
    $scope.feed.unshift(message);
  }
}



module.exports = FeedTab;