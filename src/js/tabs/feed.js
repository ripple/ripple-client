var util = require('util');
var Tab = require('../client/tab').Tab;

var FeedTab = function () {
  Tab.call(this);
};

util.inherits(FeedTab, Tab);
FeedTab.prototype.parent = 'advanced';

FeedTab.prototype.generateHtml = function () {
  return require('../../jade/tabs/feed.jade')();
};

FeedTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['transactions']);

FeedTab.prototype.angular = function (module) {
  module.controller('FeedCtrl', ['$scope', 'rpTransactions', 'rpNetwork',
                                 function ($scope, transactions, $network) {

    $network.remote.on('ledger_closed', handleMsg);
    $network.remote.on('net_server', handleMsg);

    function handleMsg(message) {
      //console.log(message);
      var today = new Date();
      message.date = [ today.getHours(),  today.getMinutes(), today.getSeconds() ].join(':');

      switch (message.type) {
        case 'transaction':
          if ($scope.transCheck) {
            message.msg = message.transaction.TransactionType;
            $scope.feed.unshift(message);
          }
          break;
        case 'ledgerClosed':
          if ($scope.ledgerChcek) {
            $scope.feed.unshift(message);
          }
          break;
        case 'net_server':
          if ($scope.serverCheck) {
            $scope.feed.unshift(message);
          }
          break;
      }
    }

    $scope.feed = [ ];

    $scope.toggle_feed_transactions = function () {
      if ($scope.transCheck) {
        transactions.addListener(handleMsg);
      } else {
        transactions.removeListener(handleMsg);
      }
    };

    $scope.toggle_feed_server = function () {
      if ($scope.serverCheck) {
        $network.remote.request_subscribe('server').request();
      } else {
        $network.remote.request_unsubscribe('server').request();
      }
    };

    $scope.clear_feed = function () {
      $scope.feed = [ ];
    };
  }]);
};

module.exports = FeedTab;
