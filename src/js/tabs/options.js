var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;

var OptionsTab = function ()
{
  Tab.call(this);
};

util.inherits(OptionsTab, Tab);

OptionsTab.prototype.mainMenu = 'advanced';

OptionsTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/options.jade')();
};

OptionsTab.prototype.angular = function(module)
{
  module.controller('OptionsCtrl', ['$scope', '$rootScope', 'rpId',
                                    function ($scope, $rootScope, $id)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.socketIp = Options.server.websocket_ip + ":" + Options.server.websocket_port;
    $scope.socketSsl = Options.server.websocket_ssl;
    $scope.blobIp = Options.blobvault;
  }]);
};

module.exports = OptionsTab;
