var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var ReceiveTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(ReceiveTab, Tab);

ReceiveTab.prototype.parent = 'main';

ReceiveTab.prototype.angular = function (module) {};

ReceiveTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/receive.jade')();
};

ReceiveTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('.btn').click(function (e) {
    e.preventDefault();

    var address = self.el.find('.address').text();

    highlightAnimation();

    // TODO: Actually copy (using Flash)
  });

  this.el.find('.select').click(function (e) {
    e.preventDefault();

    self.el.find('.address input').select();
  });

  function highlightAnimation() {
    // Trigger highlight animation
    self.el.find('.address')
      .stop()
      .css('background-color', '#fff')
      .effect('highlight', {
        color: "#8BC56A",
        easing: jQuery.easing.easeOutSine()
      }, 800);
  }
};

module.exports = ReceiveTab;
