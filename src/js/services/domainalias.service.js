/**
 * DOMAIN ALIAS
 *
 * The domain alias service resolves ripple address to domains.
 *
 * In the AccountRoot entry of any ripple account users can provide a reference
 * to a domain they own. Ownership of the domain is verified via the ripple.txt
 * magic file.
 *
 * This service provides both the lookup in the ledger and the subsequent
 * verification via ripple.txt.
 */

var module = angular.module('domainalias', ['network', 'rippletxt']);

module.factory('rpDomainAlias', ['$q', '$rootScope', 'rpNetwork', 'rpRippleTxt',
                                 function ($q, $scope, net, txt)
{
  var promises = {};

  /**
   * Validates a domain against an object parsed from ripple.txt data.
   *
   * @private
   */
  function validateDomain(domain, address, data)
  {
    // Validate domain
    if (!data.domain ||
        data.domain.length !== 1 ||
        data.domain[0] !== domain) {
      return false;
    }

    // Validate address
    if (!data.accounts) {
      return false;
    }
    for (var i = 0, l = data.accounts.length; i < l; i++) {
      if (data.accounts[i] === address) {
        return true;
      }
    }

    return false;
  }

  function getAliasForAddress(address)
  {
    if (promises[address]) {
      return promises[address];
    }

    var aliasPromise = $q.defer();

    net.remote.requestAccountInfo({account: address})
      .on('success', function (data) {
        if (data.account_data.Domain) {
          $scope.$apply(function () {
            var domain = sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(data.account_data.Domain));

            txt
              .get(domain)
              .then(
                function (data) {
                  if (validateDomain(domain, address, data)) {
                    aliasPromise.resolve(domain);
                  }
                  else {
                    aliasPromise.reject(new Error("Invalid domain"));
                  }
                },
                function (error) {
                  aliasPromise.reject(new Error(error));
                }
              );
          });
        }
        else {
          aliasPromise.reject(new Error("No domain found"));
        }
      })
      .on('error', function () {
        aliasPromise.reject(new Error("No domain found"));
      })
      .request();

    return promises[address] = aliasPromise.promise;
  }

  return {
    getAliasForAddress: getAliasForAddress
  };
}]);
