var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var MxnTab = function () {
  gatewayTab.call(this, 'mxn', 'MxnCtrl', 'MXN', 'rG6FZ31hDHN1K5Dkbma3PSB5uVCuVVRzfn', 'mxnConnected');
};

util.inherits(MxnTab, gatewayTab);

module.exports = MxnTab;
