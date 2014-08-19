var util = require('util');
var Tab  = require('../client/tab').Tab;

var SecurityTab = function ()
{
  Tab.call(this);
};

util.inherits(SecurityTab, Tab);

SecurityTab.prototype.tabName = 'security';
SecurityTab.prototype.mainMenu = 'security';

SecurityTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/security.jade')();
};

SecurityTab.prototype.angular = function (module) {
  module.controller('SecurityCtrl', ['$scope', 'rpId', 'rpOldBlob', 'rpTracker',
                                     'rpKeychain', '$timeout', 'rpAuthFlow', 'rpPopup',
                                     function ($scope, $id, $blob, $rpTracker,
                                               keychain, $timeout, authflow, popup)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.settingsPage = 'security';

    $scope.showComponent = [];


    $scope.isUnlocked = true; //hiding the dialog for now
    //$scope.isUnlocked = keychain.isUnlocked($id.account);
    $scope.loading2FA = false;
    
    $scope.$on('$blobUpdate', onBlobUpdate);
    onBlobUpdate();

    $scope.security = {};

    function onBlobUpdate()
    {
      if ("function" === typeof $scope.userBlob.encrypt) {
        $scope.enc = $scope.userBlob.encrypt();
      }
      
      $scope.persistUnlock = $scope.userBlob.data.persistUnlock;
    }

    if ($scope.isUnlocked) {
      //$timeout(load2FA, 50);
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
        $scope.sessionPassword = '';
        
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


    /*
      rp-confirm(
        action-text="Are you in a safe place, where no person, or camera can see your screen?"
        action-button-text="Yes, show me"
        action-function="SecretKeyUnmask=true"
        cancel-button-text="No"
        ng-hide="SecretKeyUnmask")
     */

    $scope.unmaskSecret = function () {
      keychain.requestSecret($id.account, $id.username, 'showSecret', function (err, secret) {
        if (err) {
          // XXX Handle error
          return;
        }

        $scope.security.master_seed = secret;
      });
    };


    $scope.setPasswordProtection = function () {
      $scope.editUnlock = false;

      keychain.setPasswordProtection($scope.persistUnlock, function(err, resp){
        if (err) {
          console.log(err);
          $scope.persistUnlock = !$scope.persistUnlock;
          //TODO: report errors to user
        }
      });
    };

    $scope.cancelUnlockOptions = function () {
      $scope.editUnlock = false;
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
              requestToken(false, function(err, resp) {
                //TODO: handle error
                
                $scope.savingPhone = false;
                $scope.mode2FA     = 'verifyPhone';
                popup.close();
              });
            }
          });
        });
      });
    };

    function requestToken (force, callback) {

      authflow.requestToken($scope.userBlob.url, $scope.userBlob.id, force, function(tokenError, tokenResp) {
        if (tokenError) {
          $scope.error2FA = true;
        } else {
          $scope.via = tokenResp.via;
        }

        callback(tokenError, tokenResp);
      });
    }

    $scope.requestToken = function () {
      var force = $scope.via === 'app' ? true : false;
      
      $scope.isRequesting = true;
      requestToken(force, function(err, resp) {
        $scope.isRequesting = false;
        //TODO: present message of resend success or failure
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

      $scope.openFormPassword = false;
      $scope.password1 = '';
      $scope.password2 = '';
      $scope.passwordSet = {};
      $scope.loading = false;
      $scope.error = false;

      if ($scope.changeForm) {
        $scope.changeForm.$setPristine(true);
      }
  };

  reset();
  $scope.success = false;

  }]);
};

module.exports = SecurityTab;
