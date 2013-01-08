var util = require('util');
var Tab = require('../client/tabmanager').Tab;
var id = require('../client/id').Id.singleton;

var ExchangeTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(ExchangeTab, Tab);

ExchangeTab.prototype.parent = 'wallet';

ExchangeTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/exchange.jade')();
};

ExchangeTab.prototype.onAfterRender = function ()
{

};

module.exports = ExchangeTab;
