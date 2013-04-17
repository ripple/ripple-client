var util = require('util');
var Tab = require('../client/tab').Tab;

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

FeedTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['transactions']);

FeedTab.prototype.angular = function (module)
{
  var app = this.app;
  var self=this;
  
  module.controller('FeedCtrl', ['$scope', 'rpTransactions', 'rpNetwork',
                                 function ($scope, transactions, $network)
  {
    $network.remote.on("ledger_closed", handleMsg);
    $network.remote.on("net_server", handleMsg);

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
      if($scope.transCheck) {
        transactions.addListener(handleMsg);
      } else {
        transactions.removeListener(handleMsg);
      }
    };
    $scope.toggle_feed_server = function ()
    {
      if($scope.serverCheck)
        $network.remote.request_subscribe("server").request();
      else $network.remote.request_unsubscribe("server").request();
    };
    $scope.clear_feed = function ()
    {
      $scope.feed=[];
    };
  }]);
};



module.exports = FeedTab;
