var util = require('util'),
    Tab = require('../client/tab').Tab;

var WithdrawTab = function ()
{
  Tab.call(this);
};

util.inherits(WithdrawTab, Tab);

WithdrawTab.prototype.tabName = 'withdraw';
WithdrawTab.prototype.mainMenu = 'fund';

WithdrawTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

WithdrawTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/withdraw.jade')();
};

WithdrawTab.prototype.angular = function (module)
{
  module.controller('WithdrawCtrl', ['$rootScope', 'rpId', 'rpAppManager',
                                     function ($scope, id, appManager)
  {

  }]);
};

module.exports = WithdrawTab;
