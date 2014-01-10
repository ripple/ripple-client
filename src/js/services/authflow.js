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
      $authinfo.get(Options.domain, username, processResult);
    }

    function processResult(err, authInfo) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, !!authInfo.exists);
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

        if (!authInfo.exists) {
          callback(new Error("User does not exist."));
          return;
        }

        if ("string" !== typeof authInfo.blobvault) {
          callback(new Error("No blobvault specified in the authinfo."));
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

        console.log("client: authflow: login succeeded", blob);
        callback(null, blob, keys);
      });
    }
  };

  AuthFlow.register = function (username, password, account, secret, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, function (err, authInfo) {
        if (err) {
          callback(err);
          return;
        }

        if ("string" !== typeof authInfo.blobvault) {
          callback(new Error("No blobvault specified in the authinfo."));
          return;
        }

        getLoginKeys(authInfo);
      });
    }

    function getLoginKeys(authInfo) {
      AuthFlow.getLoginKeys(authInfo, username, password, function (err, loginKeys) {
        if (err) {
          callback(err);
          return;
        }

        getUnlockKeys(authInfo, loginKeys);
      });
    }

    function getUnlockKeys(authInfo, loginKeys) {
      AuthFlow.getUnlockKeys(authInfo, username, password, function (err, unlockKeys) {
        if (err) {
          callback(err);
          return;
        }

        setBlob(authInfo, loginKeys, unlockKeys);
      });
    }

    function setBlob(authInfo, loginKeys, unlockKeys) {
      $blob.create(authInfo.blobvault,
                   loginKeys.id, loginKeys.crypt,
                   unlockKeys.unlock,
                   username,
                   account, secret,
                   function (err, blob) {
        if (err) {
          callback(err);
          return;
        }

        console.log("client: authflow: registration succeeded", blob);
        callback(null, blob, loginKeys);
      });
    }
  };

  AuthFlow.relogin = function (username, keys, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, function (err, authInfo) {
        if (err) {
          callback(err);
          return;
        }

        if (!authInfo.exists) {
          callback(new Error("User does not exist."));
          return;
        }

        if ("string" !== typeof authInfo.blobvault) {
          callback(new Error("No blobvault specified in the authinfo."));
          return;
        }

        getBlob(authInfo);
      });
    }

    function getBlob(authInfo) {
      $blob.init(authInfo.blobvault, keys.id, keys.crypt, function (err, blob) {
        if (err) {
          callback(err);
          return;
        }

        console.log("client: authflow: relogin succeeded", blob);
        callback(null, blob);
      });
    }
  };

  AuthFlow.unlock = function (username, password, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, username, function (err, authInfo) {
        if (err) {
          callback(err);
          return;
        }

        if (!authInfo.exists) {
          callback(new Error("User does not exist."));
          return;
        }

        if ("string" !== typeof authInfo.blobvault) {
          callback(new Error("No blobvault specified in the authinfo."));
          return;
        }

        getKeys(authInfo);
      });
    }

    function getKeys(authInfo) {
      AuthFlow.getUnlockKeys(authInfo, username, password, function (err, keys) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, keys);
      });
    }
  };

  // This is a function to derive different hashes from the same key. Each hash
  // is derived as HMAC-SHA512HALF(key, token).
  function keyHash(key, token) {
    var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    return sjcl.codec.hex.fromBits(sjcl.bitArray.bitSlice(hmac.encrypt(token), 0, 256));
  }

  AuthFlow.getKeys = function (remoteToken, localTokens,
                               authInfo, username, password,
                               callback) {
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
      $kdf.deriveRemotely(authInfo.pakdf,
                          username.toLowerCase(), remoteToken,
                          password,
                          function (err, key) {
                            if (err) {
                              callback(err);
                              return;
                            }

                            console.log("client: authflow: '"+remoteToken+"' secret is " +
                                        sjcl.codec.hex.fromBits(key));

                            var result = {
                              info: authInfo
                            };

                            localTokens.forEach(function (token) {
                              result[token] = keyHash(key, token);
                            });

                            callback(null, result);
                          });
    } catch (cerr) {
      callback(cerr);
    }
  };

  AuthFlow.getLoginKeys = AuthFlow.getKeys.bind(AuthFlow, "login", ['id', 'crypt']);
  AuthFlow.getUnlockKeys = AuthFlow.getKeys.bind(AuthFlow, "unlock", ['unlock']);

  return AuthFlow;
}]);
