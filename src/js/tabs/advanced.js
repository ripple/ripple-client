var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Currency = ripple.Currency;

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
    if (!$id.loginStatus) return $id.goId();

    // XRP currency object.
    // {name: "XRP - Ripples", order: 146, value: "XRP"}
    var xrpCurrency = Currency.from_json("XRP");

    $scope.xrp = {
      name: xrpCurrency.to_human({full_name:$scope.currencies_all_keyed.XRP.name}),
      code: xrpCurrency.get_iso(),
      currency: xrpCurrency
    };

    $scope.options = Options;
    $scope.optionsBackup = $.extend(true, {}, Options);
    $scope.passwordProtection = !$scope.userBlob.data.persistUnlock;
    $scope.editBridge = false;
    $scope.editBlob = false;
    $scope.editMaxNetworkFee = false;
    $scope.editAcctOptions = false;
    $scope.max_tx_network_fee_human = ripple.Amount.from_json($scope.options.max_tx_network_fee).to_human();

    $scope.advanced_feature_switch = Options.advanced_feature_switch;

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

    $scope.saveMaxNetworkFee = function () {
      // Save in local storage
      if (!store.disabled) {
        $scope.options.max_tx_network_fee = ripple.Amount.from_human($scope.max_tx_network_fee_human).to_json();
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.editMaxNetworkFee = false;

      // Reload
      location.reload();
    };

    $scope.saveAcctOptions = function () {
      if (!store.disabled) {
        // Save in local storage
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.editAcctOptions = false;

      // Reload
      location.reload();
    };

    $scope.deleteBlob = function () {
      $scope.options.blobvault = "";
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    };

    $scope.deleteBridge = function () {
      $scope.options.bridge.out.bitcoin = "";
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    };

    $scope.cancelEditBlob = function () {
      $scope.editBlob = false;
      $scope.options.blobvault = $scope.optionsBackup.blobvault;
    };

    $scope.cancelEditBridge = function () {
      $scope.editBridge = false;
      $scope.options.bridge.out.bitcoin = $scope.optionsBackup.bridge.out.bitcoin;
    };

    $scope.cancelEditMaxNetworkFee = function () {
      $scope.editMaxNetworkFee = false;
      $scope.options.max_tx_network_fee = $scope.optionsBackup.max_tx_network_fee;
    };

    $scope.cancelEditAcctOptions = function () {
      $scope.editAcctOptions = false;
    };


    $scope.$on('$blobUpdate', function () {
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
      if(!$scope.options.server.servers.isEmptyServer)
        $scope.options.server.servers.push({isEmptyServer: true, secure: false});

      // Set editing to true
      $scope.editing = true;

    };

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
      };

      $scope.hasRemove = function () {
        return !$scope.server.isEmptyServer && $scope.options.server.servers.length !== 1;
      };

      $scope.cancel = function () {
        if ($scope.server.isEmptyServer) {
          $scope.remove();
          return;
        }

        $scope.editing = false;
        $scope.server = $.extend({}, $scope.optionsBackup.server.servers[$scope.index]);

      };

      $scope.noCancel = function () {
        return $scope.server.isEmptyServer && $scope.options.server.servers.length === 1;
      };

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
