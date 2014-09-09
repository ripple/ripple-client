var util = require('util'),
    Tab = require('../client/tab').Tab;

var BtcTab = function ()
{
  Tab.call(this);
};

util.inherits(BtcTab, Tab);

BtcTab.prototype.tabName = 'btc';
BtcTab.prototype.mainMenu = 'fund';

BtcTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

BtcTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/btc.jade')();
};

BtcTab.prototype.angular = function (module)
{
  module.controller('BtcCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams',
                                     function ($scope, $id, appManager, rpTracker, $routeParams)
  {
 
    $scope.accountLines = {};
    $scope.showComponent = [];

    if (!$id.loginStatus) return $id.goId();

    $scope.openPopup = function () {
      $scope.emailError = false;
      rpTracker.track('B2R Show Connect');
    };

    // B2R Signup
    $scope.B2RSignup = function () {
      var fields = {};

      $scope.loading = true;

      fields.rippleAddress = $id.account;

      fields.email = $scope.userBlob.data.email;

      $scope.B2RApp.findProfile('account').signup(fields,function(err, response){
        if (err) {
          console.log('Error',err);
          $scope.emailError = true;
          $scope.loading = false;

          rpTracker.track('B2R SignUp', {
            result: 'failed',
            message: err.message
          });

          return;
        }

        $scope.B2RApp.refresh();

        $scope.B2RSignupResponse = response;

        rpTracker.track('B2R SignUp', {
          result: 'success'
        });
      });

      $scope.B2R.progress = true;

      rpTracker.track('B2R Shared Email');
    };

  }]);
};

module.exports = BtcTab;
