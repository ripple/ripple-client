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

  function getAliasForAddress(address) {
    if (aliases[address]) {
      return aliases[address];
    } else {
      var aliasPromise = $q.defer();

      net.remote.request_account_info(address)
        .on('success', function (data) {
          if (data.account_data.Domain) {
            $scope.$apply(function () {
              var domain = sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(data.account_data.Domain));
              var txtData = txt.get(domain);
              if ("function" === typeof txtData.then) {
                txtData.then(result);
              } else {
                result(txtData);
              }
              function result(data) {
                if (data.domain && data.domain.length === 1 &&
                    data.domain[0] === domain) {
                  aliasPromise.resolve(domain);
                } else {
                  aliasPromise.resolve(false);
                }
              }
            });
          }
        })
        .on('error', function () {})
        .request();

      aliases[address] = aliasPromise.promise;

      return aliasPromise.promise;
    }
  }

  return {
    getAliasForAddress: getAliasForAddress
  };
}]);
