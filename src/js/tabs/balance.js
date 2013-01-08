var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.parent = 'account';

BalanceTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/balance.jade')();
};

BalanceTab.prototype.angular = function ()
{
};

module.exports = BalanceTab;
