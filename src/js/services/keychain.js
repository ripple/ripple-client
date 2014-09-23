/**
 * KEYCHAIN
 *
 * Manages the actual signing keys for the account.
 *
 * The account is locked by default. When a transaction is requested, the user
 * can enter their password to unlock their account for a certain period of
 * time. This class manages the timeout when the account will be re-locked.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('keychain', ['popup']);

module.factory('rpKeychain', ['$rootScope', '$timeout', 'rpPopup', 'rpId',
                              function ($scope, $timeout, popup, id)
{
  var Keychain = function ()
  {
    var _this = this;
    this.secrets = {};

    // Unlock the Desktop client right away
    if ('desktop' === $scope.client) {
      var keychain = this;
      var watcher = $scope.$watch('userBlob', function(){
        if ($scope.userBlob.data && $scope.userBlob.data.account_id) {
          keychain.secrets[$scope.userBlob.data.account_id] = {
            masterkey: $scope.userBlob.data.masterkey
          };
          watcher();
        }
      }, true);
    }
  };

  // Default unlock duration is 5 minutes
  Keychain.unlockDuration = 5 * 60 * 1000;

  Keychain.prototype.isUnlocked = function (account) {
    return !!this.secrets[account];
  };

  /**
   * Getting a secret for an account with default UI.
   *
   * This function will immediatly callback if the wallet is already unlocked.
   * Otherwise, it will automatically handle the unlock process using a modal
   * popover.
   *
   * If the user cancels the operation, the method will call the callback with
   * an error.
   */
  Keychain.prototype.requestSecret = function (account, username, purpose, callback) {
    var _this = this;

    if ("function" === typeof purpose) {
      callback = purpose;
      purpose = null;
    }

    // Handle already unlocked accounts
    if (this.secrets[account]) {
      // Keep the secret in a closure in case it happens to get locked
      // between now and when $timeout calls back.
      var secret = this.secrets[account].masterkey;
      $timeout(function () {
        callback(null, secret);
      });
      return;
    }

    var popupScope = $scope.$new();
    var unlock = popupScope.unlock = {
      isConfirming: false,
      password: '',
      purpose: purpose,
      disablePasswordPrompt: false,
      showDisablePromptCheckbox: !$scope.userBlob.data.persistUnlock
    };
    popupScope.confirm = function () {
      unlock.isConfirming = true;

      function handleSecret(err, secret) {
        if (err) {
          // XXX More fine-grained error handling would be good. Can we detect
          //     server down?
          unlock.isConfirming = false;
          unlock.error = "password";
        } else {
          popup.close();
          if (unlock.disablePasswordPrompt) {
            _this.setPasswordProtection(false, function(err, resp){
              if (err) {
              }
            });
          }
          callback(null, secret, unlock.disablePasswordPrompt);
        }
      }

      _this.getSecret(account, username, popupScope.unlock.password,
                      handleSecret);
    };
    popupScope.cancel = function () {
      callback("canceled"); //need this for setting password protection
      popup.close();
    };
    popup.blank(require('../../jade/popup/unlock.jade')(), popupScope);
  };

  /**
   * Getting a secret for an account with custom UI.
   *
   * The difference between this method and Keychain#requestSecret is that to
   * call this function you have to request the password from the user yourself.
   */
  Keychain.prototype.getSecret = function (account, username, password, callback) {
    var _this = this;

    // Handle already unlocked accounts
    if (this.secrets[account] && this.secrets[account].password === password) {
      // Keep the secret in a closure in case it happens to get locked
      // between now and when $timeout calls back.
      var secret = this.secrets[account].masterkey;
      $timeout(function () {
        callback(null, secret);
      });
      return;
    }

    id.unlock(username, password, function (err, secret) {
      if (err) {
        callback(err);
        return;
      }

      // Cache secret for unlock period
      _this.secrets[account] = {
        masterkey: secret,
        password: password
      };

      _this.expireSecret(account);
      callback(null, secret);
    });
  };

  /**
   * Synchronous way to acquire secret.
   *
   * This function will only work if the account is already unlocked. Throws an
   * error otherwise.
   */
  Keychain.prototype.getUnlockedSecret = function (account) {
    if (!this.isUnlocked) {
      throw new Error("Keychain: Tried to get secret for locked account synchronously.");
    }

    return this.secrets[account].masterkey;
  };


 /**
  * setPasswordProtection
  * @param {Object} protect
  * @param {Object} callback
  */
  Keychain.prototype.setPasswordProtection = function (requirePassword, callback) {
    var _this   = this;

    if (requirePassword === false) {
      this.requestSecret(id.account, id.username, function(err, secret) {
        if (err) {
          return callback(err);
        }

        setPasswordProtection(requirePassword, secret, callback);
      });

    } else {
      setPasswordProtection(requirePassword, null, callback);
    }

    function setPasswordProtection (requirePassword, secret, callback) {

      $scope.userBlob.set('/persistUnlock', !requirePassword, function(err, resp) {
        if (err) {
          return callback(err);
        }

        if (requirePassword) {
          _this.expireSecret(id.account);
        }

      });
    }
  };

  Keychain.prototype.expireSecret = function (account) {
    var _this = this;
    $timeout(function(){
      if (_this.secrets[account] && !$scope.userBlob.data.persistUnlock) {
        delete _this.secrets[account];
      }
    }, Keychain.unlockDuration);
  }

  return new Keychain();
}]);
