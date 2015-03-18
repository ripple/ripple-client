
(function() {
  'use strict';

/* global ripple: false, angular: false, _: false, jQuery: false, store: false, Options: false */

  var webutil = require('../util/web');

  /**
   * Validate a trust destination.
   *
   * - rp-account-exists-model        - If set, loads data to check from here.
   *
   * Checks with rippled network if account exists.
   * According to rippled unfunded accounts do not exist.
   */
  angular.module('validators').directive('rpAccountExists', rpAccountExists);

  rpAccountExists.$inject = ['$timeout', '$parse', 'rpNetwork', '$q'];

  function rpAccountExists($timeout, $parse, $network, $q) {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, elm, attr, ctrl) {
        if (!ctrl) return;

        var currentCheckTimeout = null,
            currentDefer = null;

        ctrl.$asyncValidators.rpAccountExists = function(value) {

          var strippedValue = webutil.stripRippleAddress(value),
              address = ripple.UInt160.from_json(strippedValue);

          if (currentDefer) {
            // another check is pending, but it is not needed
            currentDefer.resolve(true);
            currentDefer = null;
            $timeout.cancel(currentCheckTimeout);
            currentCheckTimeout = null;
          }

          function checkFunded(addressToCheckPromise) {
            return addressToCheckPromise.then(function(addressToCheck) {
              if (addressToCheck === false) {
                // skip check
                return $q.when(true);
              }
              var address2 = ripple.UInt160.from_json(addressToCheck);
              if (address2.is_valid()) {
                var defer = $q.defer();

                $network.remote.requestAccountInfo({account: addressToCheck})
                  .on('success', function(m) {
                    defer.resolve(true);
                  })
                  .on('error', function(m) {
                    if (m && m.remote && m.remote.error === 'actNotFound') {
                      defer.reject(false);
                    } else {
                      console.log('There was an error', m);
                      defer.resolve(true);
                    }
                  })
                  .request();
                return defer.promise;
              } else {
                return $q.when(true);
              }
            });
          }

          if (address.is_valid()) {
            return checkFunded($q.when(value));
          } else if (scope.userBlob && webutil.getContact(scope.userBlob.data.contacts, strippedValue)) {
            return checkFunded($q.when(webutil.getContact(scope.userBlob.data.contacts, strippedValue).address));
          } else if (webutil.isRippleName(value)) {
            var defer = $q.defer();
            currentDefer = defer;

            currentCheckTimeout = $timeout(function() {
              currentCheckTimeout = null;
              currentDefer = null;

              rippleVaultClient.AuthInfo.get(Options.domain, value, function(err, info) {
                if (info && info.exists && info.address) {
                  defer.resolve(info.address);
                } else {
                  defer.resolve(false);
                }
              });
            }, 500);

            return checkFunded(defer.promise);
          }

          return $q.when(true);
        };

        attr.$observe('rpAccountExists', function() {
          ctrl.$validate();
        });
      }
    };
  }
})();
