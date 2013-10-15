var util = require('util');
var Tab = require('../client/tab').Tab;

var TxTab = function ()
{
  Tab.call(this);
};

util.inherits(TxTab, Tab);

TxTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/tx.jade')();
};

TxTab.prototype.angular = function (module)
{
  module.controller('TxCtrl', ['$scope', 'rpNetwork', '$routeParams',
                               function ($scope, net, $routeParams)
  {
    $scope.state = 'loading';
    $scope.transaction = {
      hash: $routeParams.id
    };

    function loadTx() {
      // XXX: Dirty, dirty. But it's going to change soon anyway.
      var request = net.remote.request_ledger_hash();
      request.message.command = 'tx';
      request.message.transaction = $routeParams.id;
      request.on('success', function (res) {
        $scope.$apply(function () {
          $scope.state = 'loaded';
          // XXX This is for the upcoming tx RPC call format change.
          var tx = res.tx ? res.tx : res;
          _.extend($scope.transaction, res);

          if (tx.TransactionType === "Payment") {
            var sender = tx.Account;
            var affectedNode;
            var difference;
            var cur;
            var i;

            if (tx.Amount.currency) {//It's not XRP
              /* Find the metadata node with entry type == "RippleState" 
              and either HighLimit.issuer == [sender's account] or 
              LowLimit.issuer == [sender's account] and 
              Balance.currency == [currency of SendMax || Amount]
              */
              if (tx.meta.AffectedNodes) {
                for (i=0; i<tx.meta.AffectedNodes.length; i++) {
                  affectedNode = tx.meta.AffectedNodes[i];
                  if (affectedNode.ModifiedNode && affectedNode.ModifiedNode.LedgerEntryType === "RippleState" && 
                    (affectedNode.ModifiedNode.FinalFields.HighLimit.issuer === sender ||
                      affectedNode.ModifiedNode.FinalFields.LowLimit.issuer === sender) &&
                    affectedNode.ModifiedNode.FinalFields.Balance.currency === tx.SendMax.currency
                    ) {
                    break;
                  } else {
                    affectedNode = null;
                  }
                }
              }

              // Calculate the difference before/after. If HighLimit.issuer == [sender's account] negate it.
              if (affectedNode) {
                difference = affectedNode.ModifiedNode.PreviousFields.Balance.value - affectedNode.ModifiedNode.FinalFields.Balance.value;
                if (affectedNode.ModifiedNode.FinalFields.HighLimit.issuer === sender) {
                  difference *= -1;
                }
                cur = affectedNode.ModifiedNode.FinalFields.Balance.currency;
              }

            } else { //It's XRP
              // Find the metadata node with entry type == "AccountRoot" and Account == [sender's account].
              if (tx.meta.AffectedNodes) {
                for (i=0; i<tx.meta.AffectedNodes.length; i++) {
                  affectedNode = tx.meta.AffectedNodes[i];
                  if (affectedNode.ModifiedNode && affectedNode.ModifiedNode.LedgerEntryType === "AccountRoot" && 
                    affectedNode.ModifiedNode.FinalFields.Account === sender) {
                    break;
                  } else {
                    affectedNode = null;
                  }
                }
              }

              // Calculate the difference minus the fee
              if (affectedNode) {
                difference = affectedNode.ModifiedNode.PreviousFields.Balance - affectedNode.ModifiedNode.FinalFields.Balance - tx.Fee;
              }
            }
            var amountSent;
            if (cur) {
              amountSent = {value:""+difference, currency:cur};
            } else {
              amountSent = difference;
            }
            $scope.amountSent = amountSent;
          }
        });
      });
      request.on('error', function (res) {
        $scope.$apply(function () {
          $scope.state = 'error';
          console.log(res);
        });
      });
      request.request();
    }

    if (net.connected) loadTx();
    else var removeListener = $scope.$on('$netConnected', function () {
      removeListener();
      loadTx();
    });
  }]);
};

module.exports = TxTab;
