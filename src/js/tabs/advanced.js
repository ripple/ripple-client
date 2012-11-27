var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var AdvancedTab = function ()
{
  Tab.call(this);
};

util.inherits(AdvancedTab, Tab);
AdvancedTab.prototype.parent = 'main';
AdvancedTab.prototype.defaultChild = 'trade';


AdvancedTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/advanced.jade')();
};

module.exports = AdvancedTab;



