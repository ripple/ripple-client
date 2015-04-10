var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var JpyTab = function () {
  gatewayTab.call(this, 'jpy', 'JpyCtrl', 'JPY', 'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN', 'jpyConnected');
};

util.inherits(JpyTab, gatewayTab);

module.exports = JpyTab;
