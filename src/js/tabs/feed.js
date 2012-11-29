var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var FeedTab = function ()
{
  Tab.call(this);
};

util.inherits(FeedTab, Tab);
FeedTab.prototype.parent = 'advanced';

FeedTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/feed.jade')();
};

FeedTab.prototype.angular = function (module)
{
  module.controller('FeedCtrl', function ($scope)
  { 
    var app = this.app;
    $scope.toggle_feed_ledger = function () 
    {
      console.log($scope.ledgerCheck);
      if($scope.ledgerCheck)
        app.net.remote.request_subscribe("ledger");
      else app.net.remote.request_unsubscribe("ledger");
    };
    $scope.toggle_feed_transactions = function () {
    };
    $scope.toggle_feed_server = function () {
    };
    $scope.clear_feed = function () {
    }; 
  });
};

module.exports = FeedTab;