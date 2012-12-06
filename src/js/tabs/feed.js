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
  
  
};

FeedTab.prototype.angular = function (module)
{
  var app = this.app;
  var self=this;
  
  module.controller('FeedCtrl', function ($scope)
  { 
    app.net.remote.on("net_transaction", handleMsg);
    app.net.remote.on("ledger_closed", handleMsg );
    app.net.remote.on("net_server", handleMsg );
    
    function handleMsg(message)
    {
      //console.log(message);
      var today = new Date();
      message.date=today.getHours()+ ":"+ today.getMinutes()+ ":"+ today.getSeconds();
     
      if(message.type=="transaction" && $scope.transCheck)
      {
        message.msg=message.transaction.TransactionType;
        $scope.feed.unshift(message);
        $scope.$digest();
      }else if(message.type=="ledgerClosed" && $scope.ledgerCheck)
      {
        $scope.feed.unshift(message);
        $scope.$digest();
      }else if(message.type=="net_server" && $scope.serverCheck)
      {
        $scope.feed.unshift(message);
        $scope.$digest();
      }
    }
    
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



module.exports = FeedTab;