var util = require('util');
var Tab = require('../client/tab').Tab;

var ReceiveTab = function ()
{
  Tab.call(this);
};

util.inherits(ReceiveTab, Tab);

ReceiveTab.prototype.tabName = 'receive';
ReceiveTab.prototype.mainMenu = 'receive';
ReceiveTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

ReceiveTab.prototype.angular = function (module) {
  module.controller('ReceiveCtrl', ['$scope', 'rpId', 'rpTracker',
                                     function ($scope, $id, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();
  }]);
};

ReceiveTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/receive.jade')();
};

module.exports = ReceiveTab;
