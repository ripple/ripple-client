/**
 * Transaction Queue
 *
 * This is the Transaction Queue service
 */

var settings = require('../util/settings');

angular
  .module('txQueue', [])
  .service('rpTxQueue', rpTxQueue);

rpTxQueue.$inject = ['$rootScope', 'rpNetwork', 'rpKeychain', 'rpId'];

function rpTxQueue($scope, network, keychain, id) {
  return {
    addTransaction: addTransaction,
    checkQueue: checkQueue,
    emptyQueue: emptyQueue
  };

  /**
   * Add (or execute immediately if account is funded) transaction to the txQueue.
   * This method will set the secret, sequence number and sign it.
   *
   * @param tx object
   * @param callback function
   */
  function addTransaction(tx) {
    if (!$scope.account.Balance) {
      // if account is unfunded, then there is no need to ask user for a key
      // Add transaction to the queue.
      // (Will be submitted as soon as account gets funding)
      var item = {
        tx_json: tx.tx_json,
        type: tx.tx_json.TransactionType
      };

      // Additional details depending on a transaction type
      if ('TrustSet' === item.type) {
        item.details = tx.tx_json.LimitAmount;
      }

      var saveTx = function(e1, r1) {
        if (e1) {
          console.warn(e1);
          return;
        }
        $scope.userBlob.unshift('/clients/rippletradecom/txQueue', item);
      }

      if ($scope.userBlob.data && !$scope.userBlob.data.clients) {
        // there is bug in RippleLib with unshift operation - if 
        // there is empty nodes in the path, it tries to create array node,
        // and nothing gets created under it, so create '/clients' explicitly
        $scope.userBlob.set('/clients', { rippletradecom: {} }, saveTx);
      } else if ($scope.userBlob.data && $scope.userBlob.data.clients && _.isArray($scope.userBlob.data.clients)) {
        // if '/clients' already set to array, clear it
        $scope.userBlob.unset('/clients', function(e, r) {
          if (e) return;
          $scope.userBlob.set('/clients', { rippletradecom: {} }, saveTx);
        });
      } else {
        saveTx();
      }
    } else {
      // Get user's secret key
      keychain.requestSecret(id.account, id.username, function(err, secret) {
        if (err) {
          console.log('client: txQueue: error while unlocking wallet: ', err);
          return;
        }

        var transaction = ripple.Transaction.from_json(tx.tx_json);

        transaction.remote = network.remote;
        transaction.secret(secret);

        // If account is funded submit the transaction right away
        transaction.submit();
      });
    }
  }

  /**
   * Check if the account has been funded.
   * If yes, submit all the transactions in the queue.
   */
  function checkQueue() {
    if (!$scope.account.Balance) return;
    if (!settings.hasSetting($scope.userBlob, 'txQueue')) return;

    var self = this;

    // Get user's secret key
    keychain.requestSecret(id.account, id.username, function (err, secret) {
      if (err) {
        console.log('client: txQueue: error while unlocking wallet: ', err);
        return;
      }

      settings.getSetting($scope.userBlob, 'txQueue').forEach(function(item) {
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
  }

  /**
   * Empty transaction queue
   */
  function emptyQueue() {
    $scope.userBlob.unset('/clients/rippletradecom/txQueue');
  }
}
