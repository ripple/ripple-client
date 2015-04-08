var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var UsdTab = function () {
  gatewayTab.call(this, 'usd', 'UsdCtrl', 'USD', 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q', 'usdConnected');
};

util.inherits(UsdTab, gatewayTab);

UsdTab.prototype.extraRoutes = [
  { name: '/usd/:result' }
];

module.exports = UsdTab;
