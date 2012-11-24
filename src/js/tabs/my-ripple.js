var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var MyAccountTab = function ()
{
  Tab.call(this);
};

util.inherits(MyAccountTab, Tab);

MyAccountTab.prototype.parent = 'account';

MyAccountTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/my-ripple.jade')();
};

module.exports = MyAccountTab;
