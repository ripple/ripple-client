var util = require('util'),
    Tab = require('../client/tab').Tab;

var UsdTab = function ()
{
  Tab.call(this);
};

util.inherits(UsdTab, Tab);

UsdTab.prototype.tabName = 'usd';
UsdTab.prototype.mainMenu = 'fund';

UsdTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

UsdTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/usd.jade')();
};

UsdTab.prototype.angular = function (module)
{
  module.controller('UsdCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams',
    function ($scope, $id, appManager, rpTracker, $routeParams)
    {
      $scope.fee = 0;
      $scope.total = 0;

      if (!$id.loginStatus) return $id.goId();

      $scope.calculate = function(amount) {
        $scope.fee = (parseInt(amount, 10) * (1/100)) + .3;
        $scope.total = parseInt(amount, 10) + $scope.fee;


      }

    }]);
};

module.exports = UsdTab;
