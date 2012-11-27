var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var LedgerTab = function ()
{
  Tab.call(this);
};

util.inherits(LedgerTab, Tab);
LedgerTab.prototype.parent = 'advanced';

LedgerTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/ledger.jade')();
};

LedgerTab.prototype.angular = function ()
{

};

module.exports = LedgerTab;