var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;

var AdvancedTab = function ()
{
  Tab.call(this);
};

util.inherits(AdvancedTab, Tab);

AdvancedTab.prototype.tabName = 'advanced';
AdvancedTab.prototype.mainMenu = 'advanced';

AdvancedTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/advanced.jade')();
};

AdvancedTab.prototype.angular = function(module)
{
  module.controller('AdvancedCtrl', ['$scope', '$rootScope', 'rpId', 'rpKeychain',
                                    function ($scope, $rootScope, $id, $keychain)
  {
    $scope.options = Options;
    $scope.optionsBackup = $.extend(true, {}, Options);
    $scope.passwordProtection = !$scope.userBlob.data.persistUnlock;
    $scope.editBridge = false;
    $scope.editBlob = false;
    $scope.editAcctOptions = false;
    
    $scope.saveBlob = function () {
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.editBlob = false;

      // Reload
      location.reload();
    };

    $scope.saveBridge = function () {
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.editBridge = false;

      // Reload
      location.reload();
    };

    $scope.saveAcctOptions = function () {
      Options.advanced_feature_switch = !Options.advanced_feature_switch;

      $scope.editAcctOptions = false;
    };

    $scope.deleteBlob = function () {
      $scope.options.blobvault = "";
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    }

    $scope.deleteBridge = function () {
      $scope.options.bridge.out.bitcoin = "";
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    }

    $scope.cancelEditBlob = function () {
      $scope.editBlob = false;
      $scope.options.blobvault = $scope.optionsBackup.blobvault;
    }

    $scope.cancelEditBridge = function () {
      $scope.editBridge = false;
      $scope.options.bridge.out.bitcoin = $scope.optionsBackup.bridge.out.bitcoin;
    }

    $scope.cancelEditAcctOptions = function () {
      $scope.editAcctOptions = false;
      
    }


    $scope.$on('$blobUpdate', function(){
      $scope.passwordProtection = !$scope.userBlob.data.persistUnlock;
    });
    
    $scope.setPasswordProtection = function () {
      $keychain.setPasswordProtection(!$scope.passwordProtection, function(err, resp){
        if (err) {
          $scope.passwordProtection = !$scope.PasswordProtection;
          //TODO: report errors to user
        }
      });
    };

    // Add a new server
    $scope.addServer = function () {
      // Create a new server line
      $scope.options.server.servers.push({isEmptyServer: true, secure: false});

      // Set editing to true
      $scope.editing = true;
    }

  }]);

  module.controller('ServerRowCtrl', ['$scope',
    function ($scope) {
      $scope.editing = $scope.server.isEmptyServer;

        // Delete the server
      $scope.remove = function () {
        $scope.options.server.servers.splice($scope.index,1);

        // Save in local storage
        if (!store.disabled) {
          store.set('ripple_settings', JSON.stringify($scope.options));
        }
      }

      $scope.hasRemove = function () {
        return !$scope.server.isEmptyServer && $scope.options.server.servers.length !== 1;
      }

      $scope.cancel = function () {
        if ($scope.server.isEmptyServer) {
          $scope.remove();
          return;
        }

        $scope.editing = false;
        $scope.server = $.extend({}, $scope.optionsBackup.server.servers[$scope.index]);

      }

      $scope.save = function () {
        $scope.server.isEmptyServer = false;
        $scope.editing = false;

        // Save in local storage
        if (!store.disabled) {
          store.set('ripple_settings', JSON.stringify($scope.options));
        }

        // Reload
      location.reload();
      };
    }
  ]);
};

module.exports = AdvancedTab;
