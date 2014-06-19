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
  module.controller('AccountCtrl', ['$scope', '$rootScope', 'rpId', 'rpKeychain', 'rpProfile',
    function ($scope, $rootScope, $id, keychain, rpProfile)
    {
      if (!$id.loginStatus) return $id.goId();

      $scope.rename = function() {
        $scope.loading = true;
        $scope.error = false;

        // Get the master key
        keychain.getSecret($id.account, $id.username, $scope.password,
          function (err, masterkey) {
            if (err) {
              console.log("client: account tab: error while " +
                "unlocking wallet: ", err);

              $scope.error = 'wrongpassword';
              $scope.loading = false;
              return;
            }

            // Rename
            $id.rename({
              new_username: $scope.username,
              password: $scope.password,
              masterkey: masterkey
            }, function(err){
              if (err) {
                console.log('client: account tab: error while ' +
                  'renaming account: ', err);
                $scope.error = true;
                $scope.loading = false;
                return;
              }

              // Re-login
              // TODO implement refresh/relogin in ID.
              $id.login({
                username: $scope.username,
                password: $scope.password
              }, function (err) {
                if (err) {
                  console.log('client: account tab: error while ' +
                    'logging user in: ', err);
                  $scope.error = 'cantlogin';
                  $scope.loading = false;
                  return;
                }

                $scope.success = true;
                reset();
              });
            });
          }
        );
      };

      var reset = function() {
        $scope.openForm = false;
        $scope.username = '';
        $scope.password = '';
        $scope.showPassword = true;
        $scope.success = false;
        $scope.loading = false;
        $scope.error = false;

        if ($scope.renameForm) {
          $scope.renameForm.$setPristine(true);
        }
      };

      reset();


      $scope.calendar = rpProfile.getBirthdayScope();
      $scope.$watch('profile.entityType', function(){
        $scope.id_types = rpProfile.getNationalIDScope($scope.profile);
      });

      function updateProfile() {
        $scope.profile = rpProfile.getProfileScope();
        $rootScope.profile = $scope.profile;
      }

      $scope.$watch('userBlob', function(){
        updateProfile();
      }, true);

      $scope.saveName = function () {
        rpProfile.saveName(function (err, result) {
          $scope.$apply(function () {
            $scope.edit = undefined;
            updateProfile();

            if (err) {
              console.log('Could not update name');

              $scope.status = 'failedName';
            }
            else {
              console.log('New name saved');

              $scope.status = 'successName';
            }

            setTimeout(function() {
              $scope.$apply(function() {
                $scope.status = '';
              });
            }, 3000);
          });
        });
      }

      $scope.saveAddress = function (callback) {
        rpProfile.saveAddress(function (err, result) {
          $scope.$apply(function () {
            $scope.edit = undefined;
            updateProfile();

            if (err) {
              console.log('Could not update address');

              $scope.status = 'failedAddress';
            }
            else {
              console.log('New address saved');

              $scope.status = 'successAddress';
            }

            setTimeout(function() {
              $scope.$apply(function() {
                $scope.status = '';
              });
            }, 3000);
          });
        });
      }

      $scope.saveID = function (callback) {
        rpProfile.saveNationalID(function (err, result) {
          $scope.$apply(function () {
            $scope.edit = undefined;
            updateProfile();

            if (err) {
              console.log('Could not update ID');

              $scope.status = 'failedID';
            }
            else {
              console.log('New ID saved');

              $scope.status = 'successID';
            }

            setTimeout(function() {
              $scope.$apply(function() {
                $scope.status = '';
              });
            }, 3000);
          });
        });
      }
    }]
  );
};

module.exports = AccountTab;



