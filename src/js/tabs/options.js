var util = require('util');
var webutil = require('../client/webutil');
var Tab = require('../client/tabmanager').Tab;

var OptionsTab = function ()
{
  Tab.call(this);
};

util.inherits(OptionsTab, Tab);
OptionsTab.prototype.parent = 'advanced';

OptionsTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/options.jade')();
};

OptionsTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['ledger']);

OptionsTab.prototype.angular = function(module)
{
  var app = this.app;

  module.controller('OptionsCtrl', ['rpLedger', '$scope', '$rootScope', function (ledger, $scope, $rootScope)
  {
    $scope.socketIp = Options.server.websocket_ip + ":" + Options.server.websocket_port;
    $scope.socketSsl = Options.server.websocket_ssl;
    $scope.blobIp = Options.blobvault;
  }]);
};

module.exports = OptionsTab;
