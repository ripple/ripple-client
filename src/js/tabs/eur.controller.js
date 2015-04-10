var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var EurTab = function () {
  gatewayTab.call(this, 'eur', 'EurCtrl', 'EUR', 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q', 'eurConnected');
};

util.inherits(EurTab, gatewayTab);

module.exports = EurTab;
