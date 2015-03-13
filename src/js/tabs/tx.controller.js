var util = require('util');
var Tab = require('../client/tab').Tab;
var rewriter = require('../util/jsonrewriter');

var TxTab = function ()
{
  Tab.call(this);
};

util.inherits(TxTab, Tab);

TxTab.prototype.tabName = 'tx';

TxTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/tx.jade')();
};

TxTab.prototype.angular = function (module)
{
  module.controller('TxCtrl', ['$scope', '$routeParams',
                               function ($scope, $routeParams)
  {
    $scope.state = 'loading';
    $scope.transaction = {
      hash: $routeParams.id
    };

    var initialLoad = $scope.$watch('userHistory', function(){
      if (!$scope.userHistory) return;

      // Get transaction
      $scope.userHistory.getTransaction($routeParams.id)
        .success(function(data){
          $.extend($scope.transaction, data.transaction.tx);

          $scope.amountSent = rewriter.getAmountSent(data.transaction.tx, data.transaction.meta);
          $scope.state = 'loaded';
        })
        .error(function(){});

      initialLoad();
    });
  }]);
};

module.exports = TxTab;
