var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

module.exports = AccountTab;
