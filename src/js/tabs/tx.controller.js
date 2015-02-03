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

          $scope.transaction.ledger = data.transaction.ledger_index;
          $scope.transaction.amountSent = rewriter.getAmountSent(data.transaction.tx, data.transaction.meta);

          // extract message and info_url from transaction memos
          $scope.transaction.Memos.map(function(item) {
            var memoType = ripple.utils.hexToString(item.Memo.MemoType);
            var memoFormat = ripple.utils.hexToString(item.Memo.MemoFormat);
            if (memoType === 'msg') {
              $scope.msg = memoFormat;
            } else if (memoType === 'info_url') {
              $scope.info_url = memoFormat;
            }
          });

          $scope.state = 'loaded';
        })
        .error(function(){});

      initialLoad();
    });
  }]);
};

module.exports = TxTab;
