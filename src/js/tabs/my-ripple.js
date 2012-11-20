var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var MyAccountTab = function ()
{
  Tab.call(this);
};

util.inherits(MyAccountTab, Tab);

module.exports = MyAccountTab;
