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
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, getBlob);
    }

    function getBlob(err, authInfo) {
      if (err) {
        callback(err);
        return;
      }

      AuthFlow.getLoginKeys(authInfo, username, password, function (err, keys) {
        if (err) {
          callback(err);
          return;
        }

        $blob.get(authInfo.blobvault, keys.id, callback);
      });
    }
  };

  AuthFlow.login = function (username, password, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, function (err, authInfo) {
        if (err) {
          callback(err);
          return;
        }

        getKeys(authInfo);
      });
    }

    function getKeys(authInfo) {
      AuthFlow.getLoginKeys(authInfo, username, password, function (err, keys) {
        if (err) {
          callback(err);
          return;
        }

        getBlob(authInfo, keys);
      });
    }

    function getBlob(authInfo, keys) {
      $blob.init(authInfo.blobvault, keys.id, keys.crypt, function (err, blob) {
        if (err) {
          callback(err);
          return;
        }

        console.log("Authflow login succeeded", blob);
        callback(null, blob);
      });
    }
  };

  AuthFlow.register = function (username, password, blob, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, function (err, authInfo) {
        if (err) {
          callback(err);
          return;
        }

        getKeys(authInfo);
      });
    }

    function getKeys(authInfo) {
      AuthFlow.getLoginKeys(authInfo, username, password, function (err, keys) {
        if (err) {
          callback(err);
          return;
        }

        setBlob(authInfo, keys);
      });
    }

    function setBlob(authInfo, keys) {
      $blob.create(authInfo.blobvault, keys.id, keys.crypt,
                   blob.data.account_id, blob.data.master_seed, blob,
                   function (err, blobObj) {
        if (err) {
          callback(err);
          return;
        }

        console.log("Authflow registration succeeded", blob);
        callback(null, blobObj);
      });
    }
  };

  // This is a function to derive different hashes from the same key. Each hash
  // is derived as HMAC-SHA512HALF(key, token).
  function keyHash(key, token) {
    var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    return sjcl.codec.hex.fromBits(sjcl.bitArray.bitSlice(hmac.encrypt(token), 0, 256));
  }

  AuthFlow.getLoginKeys = function (authInfo, username, password, callback) {
    try {
      if (authInfo.version !== 3) {
        throw new Error("This wallet is incompatible with this version of ripple-client.");
      }
      if (!authInfo.pakdf) {
        throw new Error("No settings for PAKDF in auth packet.");
      }

      // XXX Confirm these values are defined and are valid hex numbers
      //     (Maybe also enforce certain bounds?)
      //     authInfo.pakdf.modulus
      //     authInfo.pakdf.exponent
      //     authInfo.pakdf.alpha
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
  };

  return AuthFlow;
}]);
