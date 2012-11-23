var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var RegisterTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(RegisterTab, Tab);

RegisterTab.prototype.pageMode = 'single';
RegisterTab.prototype.parent = 'main';

RegisterTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/register.jade')();
};

RegisterTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('form').submit(function (e) {
    e.preventDefault();

    self.tm.gotoTab('my-ripple');

    self.app.id.register();
  });
};

module.exports = RegisterTab;
