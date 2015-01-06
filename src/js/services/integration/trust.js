/**
 * Trust profile
 *
 * This is the "Trust" profile implementation
 */
// TODO Sign sent data
angular
  .module('integrationTrust', ['txQueue','keychain'])
  .service('rpTrustProfile', ['$rootScope', 'rpNetwork', 'rpTxQueue', 'rpKeychain', 'rpId',
  function($scope, network, txQueue, keychain, id)
{
  this.trustProfile = function(manifest) {
    return {
      type: manifest.type,
      version: manifest.version,

      // TODO remove this
      grantNeccessaryTrusts: function() {
        manifest.currencies.forEach(function(currency){
          // Is there an existing trust line?
          if(existingTrustLine = $scope.lines[currency.issuer + currency.currency.toUpperCase()]) {
            // Is the trust limit enough?
            if(existingTrustLine.limit.to_number() >= currency.amount)
              // We're good with the existing trust line
              return;
          }

          // Ok, looks like we need to set a trust line
          var tx = network.remote.transaction();
          tx.rippleLineSet(id.account, currency.amount + '/' + currency.currency + '/' + currency.issuer);
          tx.setFlags('NoRipple');

          // txQueue please set the trust line asap.
          txQueue.addTransaction(tx);
        });

        if('function' == typeof callback) callback();
      }
    };
  };

  this.fromManifest = function (manifest) {
    return new this.trustProfile(manifest);
  };
}]);
