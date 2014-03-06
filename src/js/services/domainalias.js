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
  var aliases = {};

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

  function getAliasForAddress(address) {
    var aliasPromise = $q.defer();

    if (aliases[address] && aliases[address].checked) {
      if (aliases[address].domain) {
        aliasPromise.resolve(aliases[address].domain);
      }
      else {
        aliasPromise.reject(new Error("Invalid domain"));
      }

      return aliasPromise.promise;
    }

    net.remote.request_account_info(address)
      .on('success', function (data) {
        if (data.account_data.Domain) {
          $scope.$apply(function () {
            var domain = sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(data.account_data.Domain));

            var txtData = txt.get(domain);
            txtData.then(
              function (data) {
                if(validateDomain(domain, address, data)) {
                  aliases[address] = {
                    checked: true,
                    domain: domain
                  };
                  aliasPromise.resolve(domain);
                }
                else {
                  aliases[address] = {
                    checked: true,
                    domain: false
                  };
                  aliasPromise.reject(new Error("Invalid domain"));
                }
              },
              function (error) {
                aliases[address] = {
                  checked: true,
                  domain: false
                };
                aliasPromise.reject(new Error(error));
              }
            );
          });
        }
        else {
          aliases[address] = {
            checked: true,
            domain: false
          };
          aliasPromise.reject(new Error("No domain found"));
        }
      })
      .on('error', function () {
        aliasPromise.reject(new Error("No domain found"));
      })
      .request();

    return aliasPromise.promise;
  }

  return {
    getAliasForAddress: getAliasForAddress
  };
}]);
