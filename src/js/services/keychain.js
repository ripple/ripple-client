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

module.factory('rpKeychain', ['$rootScope', 'rpPopup', 'rpId',
                              function ($scope, popup, id)
{
  var Keychain = function ()
  {
    this.secrets = {};
  };

  // Default unlock duration is 5 minutes
  Keychain.unlockDuration = 5 * 60 * 1000;

  Keychain.prototype.isUnlocked = function (account) {
    return !!this.secrets[account];
  };

  Keychain.prototype.getSecret = function (account, username, password, callback) {
    var _this = this;

    // Handle already unlocked accounts
    if (this.secrets[account]) {
      // Keep the secret in a closure in case it happens to get locked
      // between now and when setImmediate calls back.
      var secret = this.secrets[account];
      setImmediate(function () {
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
      _this.secrets[account] = secret;

      setTimeout(function () {
        delete _this.secrets[account];
      }, Keychain.unlockDuration);

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

    return this.secrets[account];
  };

  //popup.blank(require('../../jade/popup/unlock.jade')(), $scope);

  return new Keychain();
}]);
