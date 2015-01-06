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

angular
  .module('domainalias', ['network', 'rippletxt'])
  .factory('rpDomainAlias', ['$q', '$rootScope', 'rpNetwork', 'rpRippleTxt',
                                 function ($q, $scope, net, txt)
{
  // Alias caching
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

  function getAliasForAddress(address)
  {
    // Return the promise if there's already a lookup in progress for this address
    // Commenting for now.. There's a ripple-lib problem we need to fix first.
    //if (aliases[address] && aliases[address].promise) {
    //  return aliases[address].promise;
    //}

    var aliasPromise = $q.defer();

    // We might already have the alias for given ripple address
    if (aliases[address] && aliases[address].resolved) {
      if (aliases[address].domain) {
        aliasPromise.resolve(aliases[address].domain);
      }
      else {
        aliasPromise.reject(new Error("Invalid domain"));
      }
    }

    // If not, then get the alias
    else {
      net.remote.requestAccountInfo({account: address})
        .on('success', function (data) {
          if (data.account_data.Domain) {
            $scope.$apply(function () {
              var domain = sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(data.account_data.Domain));

              var txtData = txt.get(domain);
              txtData.then(
                function (data) {
                  aliases[address] = {
                    resolved: true
                  };

                  if(validateDomain(domain, address, data)) {
                    aliases[address].domain = domain;
                    aliasPromise.resolve(domain);
                  }
                  else {
                    aliasPromise.reject(new Error("Invalid domain"));
                  }
                },
                function (error) {
                  aliases[address] = {
                    resolved: true
                  };
                  aliasPromise.reject(new Error(error));
                }
              );
            });
          }
          else {
            aliases[address] = {
              resolved: true
            };
            aliasPromise.reject(new Error("No domain found"));
          }
        })
        .on('error', function () {
          aliasPromise.reject(new Error("No domain found"));
        })
        .request();

      // Because finally is a reserved word in JavaScript and reserved keywords
      // are not supported as property names by ES3, we're invoking the
      // method like aliasPromise['finally'](callback) to make our code
      // IE8 and Android 2.x compatible.
      aliasPromise.promise['finally'](function(){
        aliases[address].promise = false;
      });

      aliases[address] = {
        promise: aliasPromise.promise
      };

    }

    return aliasPromise.promise;
  }

  return {
    getAliasForAddress: getAliasForAddress
  };
}]);
