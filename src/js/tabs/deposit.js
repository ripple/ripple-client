var util = require('util'),
    Tab = require('../client/tab').Tab;

var DepositTab = function ()
{
  Tab.call(this);
};

util.inherits(DepositTab, Tab);

DepositTab.prototype.tabName = 'deposit';
DepositTab.prototype.mainMenu = 'deposit';

DepositTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

DepositTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/deposit.jade')();
};

DepositTab.prototype.angular = function (module)
{
  module.controller('DepositCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams',
    function ($scope, $id, appManager, rpTracker, $routeParams)
    {

      if (!$id.loginStatus) return $id.goId();

    }]);
};

module.exports = DepositTab;
