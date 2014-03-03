/**
 * Inbound Bridge profile
 *
 * This is the "InboundBridge" profile implementation
 */

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

      trust: function(currency,issuer) {
        manifest.currencies.forEach(function(line){
          if (line.currency !== currency.toUpperCase() || line.issuer !== issuer) return;

          // Is there an existing trust line?
          if(existingTrustLine = $scope.lines[line.issuer + line.currency]) {
            // Is the trust limit enough?
            if(existingTrustLine.limit.to_number() >= line.amount)
            // We're good with the existing trust line
              return;
          }

          // Ok, looks like we need to set a trust line
          var tx = network.remote.transaction();
          tx.rippleLineSet(id.account, line.amount + '/' + line.currency + '/' + line.issuer);
          tx.setFlags('NoRipple');

          // txQueue please set the trust line asap.
          txQueue.addTransaction(tx);
        });

        if('function' == typeof callback) callback();
      },
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
        })
      },
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
        })
      }
    }
  };

  this.fromManifest = function (manifest) {
    return new this.inboundBridgeProfile(manifest);
  }
}]);