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
  module.controller('OptionsCtrl', ['$scope', '$rootScope', 'rpId', 'rpTracker',
                                    function ($scope, $rootScope, $id, $rpTracker)
  {
    $scope.servers = Options.server.servers;
    $scope.mixpanel = Options.mixpanel;
    $scope.blobIp = Options.blobvault;

    $scope.save = function () {
      // Save in local storage
      store.set('ripple_settings', JSON.stringify({
        server : {
          'servers' : $scope.servers
        },
        blobvault : $scope.blobIp,
        persistent_auth : Options.persistent_auth,
        transactions_per_page : Options.transactions_per_page,
        mixpanel : $scope.mixpanel
      }));

      // Reload
      location.reload();
    };

    $rpTracker.track('Page View', {'Page Name': 'Options'});
  }]);
};

module.exports = OptionsTab;
