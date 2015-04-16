var util = require('util');
var Tab  = require('../client/tab').Tab;
var settings = require('../util/settings');

var TwoFATab = function ()
{
  Tab.call(this);
};

util.inherits(TwoFATab, Tab);

TwoFATab.prototype.tabName = 'twofa';
TwoFATab.prototype.mainMenu = 'twofa';

TwoFATab.prototype.angular = function(module)
{
  module.controller('TwoFACtrl', ['$scope', 'rpId', 'rpKeychain', 'rpAuthFlow', '$timeout',
    function ($scope, id, keychain, authflow, $timeout)
    {

      if (!$scope.twoFAVerify) $scope.twoFAVerify = true;
      if (!$scope.editNum) $scope.editNum = false;
      if (!$scope.verificationCode) $scope.verificationCode = '';
      if (!$scope.editPhone) $scope.editPhone = false;
      if (!$scope.phoneLoading) $scope.phoneLoading = false;

      window.Authy.UI.instance(true, $scope.countryCode);

      $scope.validation_pattern_phone = /^[0-9]*$/;

      $scope.$on('$blobUpdate', onBlobUpdate);
      onBlobUpdate();

      function onBlobUpdate()
      {
        if ('function' === typeof $scope.userBlob.encrypt) {
          $scope.enc = $scope.userBlob.encrypt();
        }

        $scope.requirePassword = !settings.getSetting($scope.userBlob, 'persistUnlock');

        if (!$scope.loaded2FA && 'function' === typeof $scope.userBlob.get2FA) {
          $scope.userBlob.get2FA(function(err, resp) {
            $scope.$apply(function(){
              if (err) {
                console.log('Error: ', err);
                return;
              }

              $scope.phoneNumber = resp.phone;
              $scope.countryCode = resp.country_code;
            });
          });
        }
      }

      $scope.edit_toggle = function() {
        $scope.twoFAVerify = !$scope.twoFAVerify;
        $scope.editNum = !$scope.editNum;
      };

      $scope.requestToken = function(force, callback) {
        authflow.requestToken($scope.userBlob.url, $scope.userBlob.id, force, function(tokenError, tokenResp) {
          if (tokenError) {
            $scope.load_notification('request_token_error');
            $scope.phoneLoading = false;
            return;
          } else {
            if (callback) {
              callback(tokenError, tokenResp);
            }
          }

        });
      };

      $scope.savePhone = function() {
        $scope.phoneLoading = true;
        $scope.load_notification('loading');

        $scope.savingPhone = true;

        keychain.requestSecret(id.account, id.username, function(err, secret) {
          if (err) {
            $scope.savingPhone = false;
            $scope.load_notification('general_error');
            console.log('Error: ', err);
            $scope.phoneLoading = false;
            return;
          }

          var options = {
            masterkey    : secret,
            phone        : $scope.phoneNumber,
            country_code : $scope.countryCode
          };

          $scope.userBlob.set2FA(options, function(err, resp) {
            $scope.$apply(function(){
              if (err) {
                if (err.message === 'invalid phone') {
                  $scope.load_notification('phone_error');
                }

                $scope.savingPhone = false;
                console.log(err, resp);
                $scope.phoneLoading = false;
                return;
              } else {

                $scope.currentPhone       = options.phone;
                $scope.currentCountryCode = options.country_code;

                //request verification token
                $scope.requestToken(false, function(err, resp) {
                  if (err) {
                    $scope.savingPhone = false;
                    $scope.load_notification('general_error');
                    console.log("Error: ", err);
                    $scope.phoneLoading = false;
                    return;
                  }
                  $scope.load_notification('clear');
                  $scope.twoFAVerify = false;
                  $scope.savingPhone = false;
                  $scope.phoneLoading = false;
                });
              }
            });
          });
        });
      };

      $scope.enable2FA = function() {

        $scope.load_notification('loading');
        $scope.isVerifying  = true;

        var options = {
          url         : $scope.userBlob.url,
          id          : $scope.userBlob.id,
          token       : $scope.verificationCode,
          remember_me : false
        };

        authflow.verifyToken(options, function(err, resp){

          if (err) {
            $scope.load_notification('invalid_token');
            $scope.isVerifying  = false;
            console.log('Error: ', err);
            return;
          }

          keychain.requestSecret(id.account, id.username, function(err, secret) {

            if (err) {
              $scope.load_notification('general_error');
              $scope.isVerifying = false;
              consoe.log('Error: ', err);
              return;
            }

            var options = {
              masterkey : secret,
              enabled   : true
            };

            $scope.userBlob.set2FA(options, function(err, resp) {

              $scope.$apply(function() {
                $scope.isVerifying = false;

                if (err) {
                  $scope.load_notification('general_error');
                  $scope.error2FA = true;
                  console.log("Error: ", err);
                } else {
                  $scope.load_notification('2fa_done');

                  //remove old device ID so that
                  //next login will require 2FA
                  store.remove('device_id');

                  $timeout(function() {
                    location.href = "#/usd";
                  }, 2000);
                }
              });
            });
          });
        });
      };

    }]
  );
};

module.exports = TwoFATab;
