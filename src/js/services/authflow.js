/**
 * AUTH FLOW
 *
 * The auth flow service manages the login, unlock and registration procedures.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('authflow', ['authinfo', 'kdf']);

module.factory('rpAuthFlow', ['$rootScope', 'rpAuthInfo', 'rpKdf', 'rpBlob',
                              function ($scope, $authinfo, $kdf, $blob)
{
  var AuthFlow = {};

  AuthFlow.exists = function (username, password, callback) {
    AuthFlow.getLoginKeys(username, password, function (err, keys) {
      if (err) {
        callback(err);
        return;
      }

      $blob.get(keys.id, callback);
    });
  };

  AuthFlow.login = function (username, password, callback) {
    AuthFlow.getLoginKeys(username, password, function (err, keys) {
      if (err) {
        callback(err);
        return;
      }

      $blob.init(keys.id, keys.crypt, function (err, blob) {

      });
    });
  };

  function keyHash(key, token) {
    var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    return sjcl.codec.hex.fromBits(sjcl.bitArray.bitSlice(hmac.encrypt(token), 0, 512));
  }

  AuthFlow.getLoginKeys = function (username, password, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, deriveLoginKey);
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

          callback(null, {
            id: keyHash(key, "id"),
            crypt: keyHash(key, "crypt"),
            info: authInfo
          });
        });
      } catch (cerr) {
        callback(cerr);
      }
    }
  };

  return AuthFlow;
}]);
