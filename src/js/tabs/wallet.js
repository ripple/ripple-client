var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var WalletTab = function ()
{
  Tab.call(this);
};

util.inherits(WalletTab, Tab);

WalletTab.prototype.defaultChild = 'balance';

module.exports = WalletTab;
