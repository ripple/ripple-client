var util = require('util'),
    gatewayTab = require('./gateway').gatewayTab;

var SgdTab = function() {
  gatewayTab.call(this, 'sgd', 'SgdCtrl', 'SGD', 'r9Dr5xwkeLegBeXq6ujinjSBLQzQ1zQGjH', 'sgdConnected');
};

util.inherits(SgdTab, gatewayTab);

module.exports = SgdTab;
