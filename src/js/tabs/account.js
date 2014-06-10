var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'advanced';

AccountTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/account.jade')();
};

AccountTab.prototype.angular = function(module)
{
  module.controller('AccountCtrl', ['$scope', '$rootScope', 'rpId', '$timeout', 'rpAuthInfo', 'rpAuthFlow', 'rpKeychain',
    function ($scope, $rootScope, $id, $timeout, authinfo, authflow, keychain)
    {
      var debounce;
      $scope.$watch('username', function (username) {
        $scope.usernameStatus = null;

        if (debounce) $timeout.cancel(debounce);

        if (!username) {
          // No username entered, show nothing, do nothing
        } else if (username.length < 2) {
          $scope.usernameStatus = "invalid";
          $scope.usernameInvalidReason = "tooshort";
        } else if (username.length > 20) {
          $scope.usernameStatus = "invalid";
          $scope.usernameInvalidReason = "toolong";
        } else if (!/^[a-zA-Z0-9\-]+$/.exec(username)) {
          $scope.usernameStatus = "invalid";
          $scope.usernameInvalidReason = "charset";
        } else if (/^-/.exec(username)) {
          $scope.usernameStatus = "invalid";
          $scope.usernameInvalidReason = "starthyphen";
        } else if (/-$/.exec(username)) {
          $scope.usernameStatus = "invalid";
          $scope.usernameInvalidReason = "endhyphen";
        } else if (/--/.exec(username)) {
          $scope.usernameStatus = "invalid";
          $scope.usernameInvalidReason = "multhyphen";
        } else {
          debounce = $timeout(checkUsername, 800);
        }
      });

      function checkUsername() {
        $scope.usernameStatus = null;
        if (!$scope.username) return;

        $scope.usernameStatus = 'loading';
        authinfo.get(Options.domain, $scope.username, function (err, info) {
          $scope.usernameStatus = "ok";

          if (info.exists) {
            $scope.usernameStatus = "exists";
          } else if (info.reserved) {
            $scope.usernameStatus = "reserved";
            $scope.usernameReservedFor = info.reserved;
          }
        });
      }

      $scope.changeName = function() {
        $scope.loading = true;

        keychain.getSecret($id.account, $id.username, $scope.password,
          function (err, masterkey) {
            if (err) {
              console.log("client: account tab: error while " +
                "unlocking wallet: ", err);
              $scope.mode = "error";
              $scope.error_type = "unlockFailed";
              return;
            }

            $id.rename({
              blob: $scope.userBlob,
              url: $scope.userBlob.url,
              username: $id.username,
              new_username: $scope.username,
              password: $scope.password,
              masterkey: masterkey
            }, function(err, response){
              if (err) {
                console.log('Error',err);
                return;
              }

              // Re-login
              // TODO implement refresh/relogin in ID.
              $id.login({
                username: $scope.username,
                password: $scope.password
              }, function (err, blob) {
                if (err) {
                  console.log('Error',err);
                  return;
                }
              });

              $scope.loading = false;
            });
          }
        );
      }
    }]);
};

module.exports = AccountTab;



