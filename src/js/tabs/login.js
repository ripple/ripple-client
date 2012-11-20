var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var LoginTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(LoginTab, Tab);

LoginTab.prototype.pageMode = 'single';
LoginTab.prototype.parent = 'main';

LoginTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/login.jade')();
};

LoginTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('form').submit(function (e) {
    e.preventDefault();

    self.tm.gotoTab('my-ripple');

    self.app.id.login();
  });
};

module.exports = LoginTab;
