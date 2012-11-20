var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var ReceiveTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(ReceiveTab, Tab);

ReceiveTab.prototype.parent = 'main';

ReceiveTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/receive.jade')();
};

ReceiveTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('.btn').click(function () {
    var address = self.el.find('.address').text();

    // Trigger highlight animation
    self.el.find('.address')
      .stop()
      .css('background-color', '#fff')
      .effect('highlight', {
        color: "#8BC56A",
        easing: jQuery.easing.easeOutSine()
    }, 800);
  });
};

module.exports = ReceiveTab;
