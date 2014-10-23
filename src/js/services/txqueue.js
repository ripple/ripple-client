/**
 * Transaction Queue
 *
 * This is the Transaction Queue service
 */

var module = angular.module('txQueue', []);

module.service('rpTxQueue', ['$rootScope', 'rpNetwork', 'rpKeychain', 'rpId',
  function($scope, network, keychain, id)
{
  return {
    /**
     * Add (or execute immediately if account is funded) transaction to the txQueue.
     * This method will set the secret, sequence number and sign it.
     *
     * @param tx object
     * @param callback function
     */
    addTransaction: function(tx) {
      // If account is funded submit the transaction right away
      if ($scope.account.Balance) {
        network.remote.requestSubmit()
          .txBlob(blob)
          .request();
      }

      // If not, add it to the queue.
      // (Will be submitted as soon as account gets funding)
      else {
        var item = {
          tx_json: tx.tx_json,
          type: tx.tx_json.TransactionType
        };

        // Additional details depending on a transaction type
        if ('TrustSet' === item.type) {
          item.details = tx.tx_json.LimitAmount;
        }

        $scope.userBlob.unshift("/txQueue", item);
      }
    },

    /**
     * Check if the account has been funded.
     * If yes, submit all the transactions in the queue.
     */
    checkQueue: function() {
      if (!$scope.account.Balance || !$scope.userBlob.data.txQueue) return;

      var self = this;

      // Get user's secret key
      keychain.requestSecret(id.account, id.username, function (err, secret) {
        if (err) {
          console.log("client: txQueue: error while unlocking wallet: ", err);

          return;
        }

        $scope.userBlob.data.txQueue.forEach(function(item){
          // Backward compatibility!
          // Transactions created by RT version <= 1.0.10-1
          if (item.blob) {
            network.remote.requestSubmit()
              .txBlob(item.blob)
              .request();
            return;
          }

          var tx = ripple.Transaction.from_json(item.tx_json);
          tx.remote = network.remote;
          tx.secret(secret);
          tx.submit();
        });

        self.emptyQueue();
      });
    },

    /**
     * Empty transaction queue
     */
    emptyQueue: function() {
      $scope.userBlob.unset('/txQueue');
    }
  };
}]);