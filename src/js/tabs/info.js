var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var InfoTab = function ()
{
  Tab.call(this);
  
};

util.inherits(InfoTab, Tab);
InfoTab.prototype.parent = 'account';

InfoTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/info.jade')();
};




module.exports = InfoTab;