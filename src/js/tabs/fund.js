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
  module.controller('FundCtrl', ['$rootScope', 'rpId', 'rpAppManager',
                                     function ($scope, $id, appManager)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.currencyPage = 'btc';

    $scope.showComponent = [];

    $scope.B2RFieldValue = {};

    // B2R Signup
    $scope.B2RSignup = function () {
      var fields = $scope.B2RFieldValue;
      fields.rippleAddress = $id.account;

      $scope.B2RApp.findProfile('account').signup(fields,function(err, response){
        if (err) {
          console.log('Error',err.message);
          return;
        }

        $scope.B2RApp.refresh();

        $scope.B2RSignupResponse = response;
      });

      $scope.B2R.progress = true;
    };
  }]);
};

module.exports = FundTab;
