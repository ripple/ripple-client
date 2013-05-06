var util = require('util');
var Tab = require('../client/tab').Tab;

var ExchangeTab = function ()
{
  Tab.call(this);
};

util.inherits(ExchangeTab, Tab);

ExchangeTab.prototype.parent = 'wallet';

ExchangeTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/exchange.jade')();
};

module.exports = ExchangeTab;
