var util = require('util'),
    Tab = require('../client/tab').Tab;

var GoldTab = function ()
{
  Tab.call(this);
};

util.inherits(GoldTab, Tab);

GoldTab.prototype.tabName = 'gold';
GoldTab.prototype.mainMenu = 'fund';

GoldTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

GoldTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/gold.jade')();
};

GoldTab.prototype.angular = function (module)
{
  module.controller('GoldCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams',
    function ($scope, $id, appManager, rpTracker, $routeParams)
    {
      if (!$id.loginStatus) return $id.goId();

      $scope.connectGBI = function() {
        $scope.counterparty_name = "~GBI";
        $scope.counterparty_address = "rrh7rf1gV2pXAoqA8oYbpHd8TKv5ZQeo67";


      }


    }]);
};

module.exports = GoldTab;
