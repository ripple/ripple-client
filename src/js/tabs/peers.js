var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var PeersTab = function ()
{
  Tab.call(this);
};

util.inherits(PeersTab, Tab);
PeersTab.prototype.parent = 'advanced';

PeersTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/peers.jade')();
};

PeersTab.prototype.angular = function ()
{

};

module.exports = PeersTab;