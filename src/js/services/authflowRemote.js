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

  AuthFlow.login = function (opts, callback) {
    var username = opts.username;
    var password = opts.password;

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
        callback(null, blob, keys, authInfo.username, authInfo.emailVerified);
      });
    }
  };

  /**
   * Register an account
   *
   * @param {object} opts
   * @param {string} opts.username
   * @param {string} opts.password
   * @param {string} opts.account
   * @param {string} opts.masterkey
   * @param {object=} opts.oldUserBlob
   * @param {function} callback
   */
  AuthFlow.register = function (opts, callback) {
    getAuthInfo();

    function getAuthInfo() {
      $authinfo.get(Options.domain, opts.username, function (err, authInfo) {
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
      AuthFlow.getLoginKeys(authInfo, opts.username, opts.password, function (err, loginKeys) {
        if (err) {
          callback(err);
          return;
        }

        getUnlockKeys(authInfo, loginKeys);
      });
    }

    function getUnlockKeys(authInfo, loginKeys) {
      AuthFlow.getUnlockKeys(authInfo, opts.username, opts.password, function (err, unlockKeys) {
        if (err) {
          callback(err);
          return;
        }

        setBlob(authInfo, loginKeys, unlockKeys);
      });
    }

    function setBlob(authInfo, loginKeys, unlockKeys) {
      $blob.create({
        'url': authInfo.blobvault,
        'id': loginKeys.id,
        'crypt': loginKeys.crypt,
        'unlock': unlockKeys.unlock,
        'username': opts.username,
        'account': opts.account,
        'email': opts.email,
        'masterkey': opts.masterkey,
        'oldUserBlob': opts.oldUserBlob
      },
      function (err, blob) {
        if (err) {
          callback(err);
          return;
        }

        console.log("client: authflow: registration succeeded", blob);
        callback(null, blob, loginKeys, authInfo.username);
      });
    }
  };

  AuthFlow.verify = function (opts, callback) {
    $authinfo.get(Options.domain, opts.username, function (err, authInfo) {
      if (err) {
        callback(err);
        return;
      }

      if ("string" !== typeof authInfo.blobvault) {
        callback(new Error("No blobvault specified in the authinfo."));
        return;
      }

      $blob.verify({
        username: opts.username,
        token: opts.token,
        url: authInfo.blobvault
      }, callback);
    });
  };

  AuthFlow.resendEmail = function (opts, callback) {
    $authinfo.get(Options.domain, opts.username, function (err, authInfo) {
      if (err) {
        callback(err);
        return;
      }

      if ("string" !== typeof authInfo.blobvault) {
        callback(new Error("No blobvault specified in the authinfo."));
        return;
      }

      $scope.userBlob.resendEmail({
        username: opts.username,
        email: opts.email,
        url: authInfo.blobvault
      }, callback);
    });
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
        callback(null, blob, authInfo.username);
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
      // XXX Instead of toLowerCase/replace we should be using Id.normalizeUsernameForInternals
      $kdf.deriveRemotely(authInfo.pakdf,
                          username.toLowerCase().replace(/-/g, ''), remoteToken,
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
