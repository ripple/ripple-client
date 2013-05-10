var util = require('util');
var Tab = require('../client/tab').Tab;

var RatesTab = function ()
{
  Tab.call(this);
};

util.inherits(RatesTab, Tab);

RatesTab.prototype.parent = 'wallet';

RatesTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/rates.jade')();
};

module.exports = RatesTab;
