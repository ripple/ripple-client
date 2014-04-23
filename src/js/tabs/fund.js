var util = require('util'),
    Tab = require('../client/tab').Tab;

var FundTab = function ()
{
  Tab.call(this);
};

util.inherits(FundTab, Tab);

FundTab.prototype.tabName = 'fund';
FundTab.prototype.mainMenu = 'fund';

FundTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

FundTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/fund.jade')();
};

FundTab.prototype.angular = function (module)
{
  module.controller('FundCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker',
                                     function ($scope, $id, appManager, rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.currencyPage = 'xrp';

    $scope.showComponent = [];

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

module.exports = FundTab;
