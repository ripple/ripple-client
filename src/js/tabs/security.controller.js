'use strict';

var util = require('util');
var Tab = require('../client/tab').Tab,
    settings = require('../util/settings');

var SecurityTab = function() {
  Tab.call(this);
};

util.inherits(SecurityTab, Tab);

SecurityTab.prototype.tabName = 'security';
SecurityTab.prototype.mainMenu = 'security';

SecurityTab.prototype.angular = function(module) {
  module.controller('SecurityCtrl', ['$scope', 'rpId', 'rpOldBlob', 'rpTracker', 'rpKeychain',
    function($scope, id, blob, rpTracker, keychain) {

      $scope.settingsPage = 'security';

      $scope.isUnlocked = true; // hiding the dialog for now
      // $scope.isUnlocked = keychain.isUnlocked(id.account);
      $scope.requirePasswordChanged = false;

      // Initialize the notification object
      $scope.success = {};

      $scope.security = {};

      function onBlobUpdate() {
        $scope.requirePassword = !settings.getSetting($scope.userBlob, 'persistUnlock');
      }

      $scope.$on('$blobUpdate', onBlobUpdate);
      onBlobUpdate();

      $scope.restoreSession = function() {

        if (!$scope.sessionPassword) {
          $scope.unlockError = true;
          return;
        }

        $scope.isConfirming = true;
        $scope.unlockError = null;

        keychain.getSecret(id.account, id.username, $scope.sessionPassword, function(err, secret) {
          $scope.isConfirming = false;
          $scope.sessionPassword = '';

          if (err) {
            $scope.unlockError = err;
            return;
          }

          $scope.isUnlocked = keychain.isUnlocked(id.account);
        });

      };

      $scope.unmaskSecret = function () {
        keychain.requestSecret(id.account, id.username, 'showSecret', function(err, secret) {
          if (err) {
            // XXX Handle error
            return;
          }

          $scope.security.master_seed = secret;
        });
      };

      $scope.setPasswordProtection = function() {
        $scope.editUnlock = false;

        // ignore it if we are not going to change anything
        if (!$scope.requirePasswordChanged) {
          return;
        }
        $scope.requirePasswordChanged = false;
        $scope.requirePassword = !$scope.requirePassword;
        $scope.errorSetPasswordProtection = false;

        keychain.setPasswordProtection($scope.requirePassword, function(err, resp) {
          if (err) {
            console.log(err);
            $scope.requirePassword = !$scope.requirePassword;

            // Notify errors to the user
            $scope.errorSetPasswordProtection = true;
          }
        });

        // Notify the user
        if (!$scope.errorSetPasswordProtection) {
          if ($scope.requirePassword) {
            $scope.success.enableRequirePassword = true;
            $scope.success.disableRequirePassword = false;
          } else {
            $scope.success.enableRequirePassword = false;
            $scope.success.disableRequirePassword = true;
          }
        }

      };

      var reset = function() {
        $scope.loading = false;
        $scope.error = false;
      };

      reset();
    }
  ]);
};

module.exports = SecurityTab;
