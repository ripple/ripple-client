var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var SendTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(SendTab, Tab);

SendTab.prototype.parent = 'main';

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('form').submit(function (e) {
    e.preventDefault();
  });
};

module.exports = SendTab;
