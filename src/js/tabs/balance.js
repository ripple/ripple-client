var util = require('util'),
    Tab = require('../client/tab').Tab;

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.tabName = 'balance';
BalanceTab.prototype.mainMenu = 'balance';

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
  }]);
};

module.exports = BalanceTab;
