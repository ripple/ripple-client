/**
 * LEDGER
 *
 * The ledger service is used to provide information that requires watching the
 * entire ledger.
 *
 * This obviously won't scale, but it'll do long enough for us (or somebody
 * else) to come up with something better.
 */

var module = angular.module('ledger', []);

module.factory('rpLedger', ['$q', '$rootScope', function($q, $rootScope) {
  var offerPromise = $q.defer();

  var ledger = {
    offers: offerPromise.promise,
    scope: $rootScope
  };

  rippleclient.net.remote.request_ledger("ledger_closed", "full")
    .on('success', handleLedger)
    .request();

  function handleLedger(e)
  {
    $rootScope.$apply(function(){
      var offers = e.ledger.accountState.filter(function (node) {
        return node.LedgerEntryType === "Offer";
      });

      offerPromise.resolve(offers);
      ledger.offers = offers;
    });
  }

  return ledger;
}]);
