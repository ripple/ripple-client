var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var GoldTab = function () {
  gatewayTab.call(this, 'gold', 'GoldCtrl', 'XAU', 'rrh7rf1gV2pXAoqA8oYbpHd8TKv5ZQeo67', 'gbiConnected');
};

util.inherits(GoldTab, gatewayTab);

module.exports = GoldTab;
