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
    $scope.socketIp = Options.server.websocket_ip;
    $scope.socketPort = Options.server.websocket_port;
    $scope.socketSsl = Options.server.websocket_ssl;
    $scope.blobIp = Options.blobvault;

    $scope.save = function () {
      // Save in local storage
      store.set('ripple_settings', JSON.stringify({
        server: {
          "trusted" : true,
          "websocket_ip" : $scope.socketIp,
          "websocket_port" : $scope.socketPort,
          "websocket_ssl" : $scope.socketSsl
        },
        blobvault : $scope.blobIp,
        persistent_auth : Options.persistent_auth,
        transactions_per_page: Options.transactions_per_page
      }));

      // Reload
      location.reload();
    }
  }]);
};

module.exports = OptionsTab;
