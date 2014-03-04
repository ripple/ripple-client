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
     */
    addTransaction: function(tx) {
      // Get user's secret key
      keychain.requestSecret(id.account, id.username, function (err, secret) {
        if (err) {
          console.log("client: trust profile: error while " +
            "unlocking wallet: ", err);
          $scope.mode = "error";
          $scope.error_type = "unlockFailed";
          return;
        }

        // TODO assigning a sequence number should check sequence numbers in queue
        tx.tx_json.Sequence = $scope.account.Sequence || 1;
        tx.secret(secret);
        tx.complete();
        tx.sign();

        // Transaction blob
        var blob = tx.serialize().to_hex();

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
            blob: blob,
            type: tx.tx_json.TransactionType
          };

          // Additional details depending on a transaction type
          if ('TrustSet' === item.type) {
            item.details = tx.tx_json.LimitAmount;
          }

          $scope.userBlob.unshift("/txQueue", item);
        }
      });
    },

    /**
     * Check if the account has been funded.
     * If yes, submit all the transactions in the queue.
     */
    checkQueue: function() {
      console.log($scope.account.Balance, $scope.userBlob.data.txQueue);
      if (!$scope.account.Balance || !$scope.userBlob.data.txQueue) return;

      $scope.userBlob.data.txQueue.forEach(function(tx){
        network.remote.requestSubmit()
               .txBlob(tx.blob)
               .request();
      });

      this.emptyQueue();
    },

    /**
     * Empty transaction queue
     */
    emptyQueue: function() {
      $scope.userBlob.unset('/txQueue');
    }
  };
}]);