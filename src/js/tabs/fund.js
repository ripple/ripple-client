var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base;

var FundTab = function ()
{
  Tab.call(this);
};

util.inherits(FundTab, Tab);

FundTab.prototype.tabName = 'fund';
FundTab.prototype.mainMenu = 'fund';

FundTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/fund.jade')();
};

FundTab.prototype.angular = function (module)
{
  module.controller('FundCtrl', ['$scope', '$timeout', '$routeParams', 'rpId', 'rpNetwork', 'rpTracker', 'rpAppManager',
    function ($scope, $timeout, $routeParams, $id, $network, $rpTracker, $appManager)
  {
    if (!$id.loginStatus) return $id.goId();

    var accountProfile, trustProfile;
    $scope.fieldValue = {};

    // TODO is there a better way without a watch?
    var blobWatcher = $scope.$watch('userBlob', function(blob){
      if (blob.id) {
        $appManager.getApp('rD1jovjQeEpvaDwn9wKaYokkXXrqo4D23x', function(err, data){
          if (err) {
            console.log('Error',err);
            return;
          }

          $scope.app = data;
          accountProfile = data.profiles.account;

          trustProfile = data.profiles.trust;
          trustProfile.grantNeccessaryTrusts();

          // Check if the user already has an account
          accountProfile.getUser($id.account, function(err, response){
            if (err) {
              $scope.fields = accountProfile.getFields();

              return;
            }

            $scope.appUser = response;
            $scope.appSettings = response;
            $scope.appSettings.hasAccount = true;
          });

          $scope.loading = false;
        });

        blobWatcher();
      }
    });

    /**
     * Signup for app
     */
    $scope.signup = function(){
      var fields = $scope.fieldValue;
      fields.rippleAddress = $id.account;

      accountProfile.signup(fields,function(err, response){
        if (err) {
          console.log('Error',err.message);
          return;
        }

        $scope.response = response;

        if (response.status === 'success') {
          $scope.appSettings = {
            name: $scope.app.name,
            rippleAddress: $scope.app.rippleAddress,
            hasAccount: true
          };

          $scope.appUser = response;

          // Update blob
          $scope.userBlob.unshift("/apps", $scope.appSettings);
        }
      });
    };

    $scope.loading = true;
  }]);
};

module.exports = FundTab;
