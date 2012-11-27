var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var UNLTab = function ()
{
  Tab.call(this);
};

util.inherits(UNLTab, Tab);
UNLTab.prototype.parent = 'advanced';

UNLTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/unl.jade')();
};

UNLTab.prototype.angular = function ()
{

};

module.exports = UNLTab;