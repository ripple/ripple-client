var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var BrlTab = function() {
  gatewayTab.call(this, 'brl', 'BrlCtrl', 'BRL', 'rfNZPxoZ5Uaamdp339U9dCLWz2T73nZJZH', 'brlConnected');
};

util.inherits(BrlTab, gatewayTab);

module.exports = BrlTab;
