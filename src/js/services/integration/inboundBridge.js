/**
 * Inbound Bridge profile
 *
 * This is the "InboundBridge" profile implementation
 */

var settings = require('../../util/settings');

var module = angular.module('integrationInboundBridge', []);

module.service('rpInboundBridgeProfile', ['$rootScope', 'rpNetwork', 'rpId', '$http', 'rpTxQueue',
  function($scope, network, id, $http, txQueue)
{
  this.inboundBridgeProfile = function(manifest) {
    return {
      type: manifest.type,
      version: manifest.version,
      bridgeType: manifest.bridgeType,
      currencies: manifest.currencies,

      /**
       * Trust one of the inbound bridge supported currencies.
       *
       * @param currency
       * @param issuer
       */
      trust: function(currency,issuer) {
        // Does this inbound bridge support this currency?
        var line = _.findWhere(manifest.currencies, {
          currency: currency.toUpperCase(),
          issuer: issuer
        });

        // Nope
        if (!line) {
          console.warn("This service doesn't support " + currency + '/' + issuer);
          return;
        }

        // Is there an existing trust line?
        if(existingTrustLine = $scope.lines[line.issuer + line.currency]) {
          // Is the trust limit enough?
          if(existingTrustLine.limit.to_number() >= line.amount)
          // We're good with the existing trust line
            return;
        }

        // Is there an existing trustTx in queue?
        // (Does this really belong here? maybe just move it to txqueue.js?)
        var noNeed;
        _.each(
          // Find all trust transactions in queue
          _.findWhere(settings.getSetting($scope.userBlob, 'txQueue'), {type: "TrustSet"}),
          function(elm, index, txInQueue) {
            // Does this fulfil our needs?
            noNeed = txInQueue && txInQueue.details.currency === line.currency
              && txInQueue.details.issuer === line.issuer
              && txInQueue.details.value >= line.amount;
          }
        );

        // We already have the necessary trustTx waiting in line.
        if (noNeed) return;

        // Ok, looks like we need to set a trust line
        var tx = network.remote.transaction();
        tx.rippleLineSet(id.account, line.amount + '/' + line.currency + '/' + line.issuer);
        tx.setFlags('NoRipple');

        // Add memo to tx
        tx.addMemo('client', 'rt' + $scope.version);

        // txQueue please set the trust line asap.
        txQueue.addTransaction(tx);
      },

      /**
       * Get instructions on using the inbound bridge
       *
       * @param rippleAddress
       * @param callback
       */
      getInstructions: function(rippleAddress, callback) {
        $http({
          url: manifest.urls.instructions,
          method: 'GET',
          params: {rippleAddress: rippleAddress}
        })
        .success(function(response){
          if (response.status === 'error') {
            callback({
              message: response.message
            });

            return;
          }

          callback(null, response);
        })
        .error(function(data,status){
          callback({
            message: "Can't get the instructions."
          });
        });
      },

      /**
       * Get pending deposits list
       *
       * @param rippleAddress
       * @param callback
       */
      getPending: function(rippleAddress, callback) {
        $http({
          url: manifest.urls.pending,
          method: 'GET',
          params: {rippleAddress: rippleAddress}
        })
        .success(function(response){
          if (response.status === 'error') {
            callback({
              message: response.message
            });

            return;
          }

          callback(null, response.deposits);
        })
        .error(function(data,status){
          callback({
            message: "Can't get pending deposits."
          });
        });
      }
    };
  };

  /**
   * Create and return a new instance of inbound bridge based on manifest
   *
   * @param manifest
   * @returns {profiles.inboundBridgeProfile}
   */
  this.fromManifest = function (manifest) {
    return new this.inboundBridgeProfile(manifest);
  };
}]);
