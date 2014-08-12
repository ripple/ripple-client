var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'account';

AccountTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/account.jade')();
};

AccountTab.prototype.angular = function(module)
{
  module.controller('AccountCtrl', ['$scope', '$timeout', 'rpId', 'rpPopup', 'rpKeychain', 'rpAuthFlow',
    function ($scope, $timeout, $id, popup, keychain, authflow)
    {
      if (!$id.loginStatus) return $id.goId();
      
      $scope.isUnlocked  = keychain.isUnlocked($id.account);
      $scope.loading2FA  = false;
      
      //$scope.mode2FA = 'verifyPhone';

      if ($scope.isUnlocked) {
        $timeout(load2FA, 50);
      }
      
      $scope.restoreSession = function() {
        
        if (!$scope.sessionPassword) {
          $scope.unlockError = true;
          return;
        }

        $scope.isConfirming = true;
        $scope.unlockError  = null;

        keychain.getSecret($id.account, $id.username, $scope.sessionPassword, function(err, secret) {
          $scope.isConfirming = false;
          
          if (err) {
            $scope.unlockError = err;
            return;
          }
          
          $scope.isUnlocked = keychain.isUnlocked($id.account);
          load2FA();
        });

      };

      function load2FA () {
        $scope.loading2FA      = true;
        $scope.errorLoading2FA = false;

        keychain.requestSecret($id.account, $id.username, function(err, secret) {
          if (err) {
            $scope.errorLoading2FA = true;
            return;
          }
          
          $scope.userBlob.get2FA(secret, function(err, resp) {
            $scope.$apply(function(){
              $scope.loading2FA = false;
              if (err) {
                $scope.errorLoading2FA = true;
                return;
              }

              $scope.enabled2FA         = resp.enabled;
              $scope.currentPhone       = resp.phone;
              $scope.currentCountryCode = resp.country_code;         
            });            
          });
        });
      }

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

      $scope.changePassword = function() {
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

            // Change password
            $id.changePassword({
              username: $id.username,
              password: $scope.password1,
              masterkey: masterkey,
              blob: $scope.userBlob
            }, function(err){
              if (err) {
                console.log('client: account tab: error while ' +
                  'changing the account password: ', err);
                $scope.error = true;
                $scope.loading = false;
                return;
              }

              $scope.success = true;
              reset();
            });
          }
        );
      };

      $scope.open2FA = function() {
        $scope.$apply(function(){
          $scope.mode2FA        = '';
          $scope.loading        = false;
          $scope.error2FA       = false;
          $scope.disableSuccess = false;
          $scope.phoneNumber    = $scope.currentPhone;
          $scope.countryCode    = $scope.currentCountryCode;
          window.Authy.UI.instance(true, $scope.countryCode); //enables the authy dropdown 
        });

        //authy.setCountryCode(0, $scope.countryCode);
          /*
          //not very angular but I think its the only way in this case
          var countryCode = document.getElementsByName('countryCode')[0].value;
          var options = {
            masterkey    : secret,
            remember_me  : true,
            enabled      : $scope.enabled2FA,
            phone        : $scope.phoneNumber,
            country_code : countryCode,
            via          : "sms"
          };

          $scope.userBlob.set2FA(options, function(err, resp){
            console.log(err, resp);
          });
          */

      };

      $scope.savePhone = function() {
        $scope.mode2FA     = 'savePhone';
        $scope.error2FA    = false;
        $scope.savingPhone = true;

        keychain.requestSecret($id.account, $id.username, function(err, secret) {
          if (err) {
            $scope.mode2FA = '';
            return;
          }

          //not very angular but I think its the only way in this case
          var countryCode = document.getElementsByName('countryCode')[0].value;

          var options = {
            masterkey    : secret,
            phone        : $scope.phoneNumber,
            country_code : countryCode 
          };

          $scope.userBlob.set2FA(options, function(err, resp) {
            $scope.$apply(function(){
              $scope.mode2FA = '';
              if (err) {
                console.log(err, resp);
                $scope.error2FA    = true;
                $scope.savingPhone = false;
                popup.close();
              } else {
                
                $scope.currentPhone       = options.phone;
                $scope.currentCountryCode = options.country_code;

                //request verification token
                requestToken(function(err, resp) {

                  //TODO: handle error
                  console.log(err, resp);
                  $scope.savingPhone = false;
                  $scope.mode2FA     = 'verifyPhone';
                  popup.close();
                });                
              }
            });
          });          
        });          
      };


      function requestToken (callback) {
        //return callback (null, null);
        authflow.requestToken($scope.userBlob.url, $scope.userBlob.id, false, function(tokenError, tokenResp) {
          $scope.mode2FA = '';

          if (tokenError) {
            $scope.error2FA = true;
          } 

          callback(tokenError, tokenResp);
        });
      }

      $scope.resendToken = function () {
        $scope.isResending = true;

        requestToken(function(err, resp) {
          console.log(err, resp);
          $scope.isResending = false;
          //present message of resend success or failure
        });
      }

      $scope.enable2FA = function() {
        
        $scope.isVerifying  = true;
        $scope.invalidToken = false;

        var options = {
          url         : $scope.userBlob.url,
          id          : $scope.userBlob.id,
          token       : $scope.verifyToken,
          remember_me : false
        };

        authflow.verifyToken(options, function(err, resp){

          console.log(err, resp);
          if (err) {
            $scope.invalidToken = true;
            $scope.isVerifying  = false;
            return;
          }

          keychain.requestSecret($id.account, $id.username, function(err, secret) {

            if (err) {
              $scope.mode2FA     = '';
              $scope.isVerifying = false;
              return;
            }

            var options = {
              masterkey : secret,
              enabled   : true
            };

            $scope.userBlob.set2FA(options, function(err, resp) {
              $scope.$apply(function() {
                $scope.isVerifying = false;
                $scope.mode2FA     = '';

                if (err) {
                  $scope.error2FA = true;
                } else {

                  //remove old device ID so that
                  //next login will require 2FA
                  store.remove('device_id');  
                  $scope.enabled2FA    = true;
                  $scope.enableSuccess = true;
                }
              });
            });          
          }); 
        });
      };

      $scope.disable2FA = function() {
        $scope.mode2FA       = 'disable';
        $scope.error2FA      = false;
        $scope.enableSuccess = false;

        keychain.requestSecret($id.account, $id.username, function(err, secret) {
          if (err) {
            $scope.mode2FA = '';
            return;
          }

          var options = {
            masterkey : secret,
            enabled   : false
          };

          $scope.userBlob.set2FA(options, function(err, resp) {
            $scope.$apply(function(){
              $scope.mode2FA = '';
              if (err) {
                $scope.error2FA   = true;
              } else {
                $scope.enabled2FA     = false;
                $scope.disableSuccess = true;
              }
            });
          });          
        });          
      };

      $scope.cancel2FA = function () {
        $scope.mode2FA = ''; 
        $scope.invalidToken = false;
        $scope.error2FA     = false;
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

        $scope.openFormPassword = false;
        $scope.password1 = '';
        $scope.password2 = '';
        $scope.passwordSet = {};

        if ($scope.changeForm) {
          $scope.changeForm.$setPristine(true);
        }
      };

      reset();
    }]
  );
};

module.exports = AccountTab;
