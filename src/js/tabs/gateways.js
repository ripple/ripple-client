var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var GatewaysTab = function ()
{
  Tab.call(this);
};

util.inherits(GatewaysTab, Tab);

GatewaysTab.prototype.mainMenu = 'wallet';

GatewaysTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/gateways.jade')();
};

GatewaysTab.prototype.angular = function (module)
{
  module.controller('GatewaysCtrl', ['$scope', 'rpId', 'rpNetwork', 'rpZipzap',
                                     function ($scope, $id, $network, $zipzap)
  {
    if (!$id.loginStatus) return $id.goId();

    $zipzap.register();
    $zipzap.request();
  }]);
};

module.exports = GatewaysTab;
