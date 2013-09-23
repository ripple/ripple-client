/**
 * AUTH FLOW
 *
 * The auth flow service manages the login, unlock and registration procedures.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('authflow', ['authinfo', 'kdf']);

module.factory('rpAuthFlow', ['$rootScope', 'rpAuthInfo', 'rpKdf', function
                              ($scope, $authinfo, $kdf)
{
  var AuthFlow = {};

  AuthFlow.exists = function (username, password, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(username, deriveLoginKey);
    }

    function deriveLoginKey(err, authInfo) {
      try {
        if (authInfo.version !== 3) {
          throw new Error("This wallet is incompatible with this version of ripple-client.");
        }
        $kdf.deriveRemotely(authInfo.pakdf, username, "login", password,
                            function (err, key) {
          if (err) {
            callback(err);
            return;
          }

          console.log(key);
        });
      } catch (err) {
        callback(err);
      }
    }
  };

  return AuthFlow;
}]);
