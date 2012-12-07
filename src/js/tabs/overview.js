var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var OverviewTab = function ()
{
  Tab.call(this);
};

util.inherits(OverviewTab, Tab);

OverviewTab.prototype.parent = 'account';

OverviewTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/overview.jade')();
};

OverviewTab.prototype.angular = function ()
{
};

module.exports = OverviewTab;
