var util = require('util'),
    Tab = require('../client/tab').Tab;

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.tabName = 'balance';
BalanceTab.prototype.mainMenu = 'wallet';

BalanceTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

BalanceTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/balance.jade')();
};

BalanceTab.prototype.angular = function (module)
{
  module.controller('BalanceCtrl', ['$rootScope', 'rpId', 'rpAppManager',
                                     function ($scope, $id, appManager)
  {
    if (!$id.loginStatus) return $id.goId();

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

module.exports = BalanceTab;
