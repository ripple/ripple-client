var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var FeedTab = function ()
{
  Tab.call(this);
};

util.inherits(FeedTab, Tab);
FeedTab.prototype.parent = 'advanced';

FeedTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/feed.jade')();
};

FeedTab.prototype.angular = function ()
{

};

module.exports = FeedTab;