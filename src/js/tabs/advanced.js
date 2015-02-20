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
  module.controller('AdvancedCtrl', ['$scope', 'rpId', 'rpKeychain', 'rpNetwork',
                                    function ($scope, id, keychain, network)
  {
    // XRP currency object.
    // {name: 'XRP - Ripples', order: 146, value: 'XRP'}
    var xrpCurrency = Currency.from_json('XRP');

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
    $scope.editConfirmation = {
      send: false,
      exchange: false,
      trade: false
    };
    $scope.max_tx_network_fee_human = ripple.Amount.from_json($scope.options.max_tx_network_fee).to_human();
    $scope.advancedFeatureSwitchChanged = false;
    $scope.confirmationChanged = {
      send: false,
      exchange: false,
      trade: false
    };

    // Initialize the notification object
    $scope.success = {};

    $scope.saveBlob = function () {
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.editBlob = false;

      // Reload
      location.reload();

      // Notify the user
      $scope.success.saveBlob = true;
    };

    $scope.saveBridge = function () {
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.editBridge = false;

      // Notify the user
      $scope.success.saveBridge = true;
    };

    $scope.saveMaxNetworkFee = function () {
      // Save in local storage
      if (!store.disabled) {
        $scope.options.max_tx_network_fee = ripple.Amount.from_human($scope.max_tx_network_fee_human).to_json();
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
      // This has to be updated manually because the network object is not
      // recreated unless we do location.reload()
      network.remote.max_fee = $scope.options.max_tx_network_fee;

      $scope.editMaxNetworkFee = false;

      // Notify the user
      $scope.success.saveMaxNetworkFee = true;
    };

    $scope.saveConfirmation = function (transactionType) {
      //ignore it if we are not going to change anything
      if (!$scope.confirmationChanged[transactionType]) {
        $scope.editConfirmation[transactionType] = false;
        return;
      }
      $scope.confirmationChanged[transactionType] = false;

      $scope.userBlob.set('/clients/rippletradecom/confirmation', $scope.options.confirmation)

      $scope.editConfirmation[transactionType] = false;

      // Notify the user
      $scope.success.saveConfirmation[transactionType] = true;
    };

    $scope.saveAcctOptions = function () {
      //ignore it if we are not going to change anything
      if (!$scope.advancedFeatureSwitchChanged) {
        return;
      }
      $scope.advancedFeatureSwitchChanged = false;

      if (!store.disabled) {
        // Save in local storage
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      $scope.userBlob.set('/clients/rippletradecom/trust/advancedMode', $scope.options.advanced_feature_switch);

      $scope.editAcctOptions = false;

      // Notify the user
      $scope.success.saveAcctOptions = true;
    };

    $scope.deleteBlob = function () {
      $scope.options.blobvault = '';
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    };

    $scope.deleteBridge = function () {
      $scope.options.bridge.out.bitcoin = '';
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

    $scope.cancelEditConfirmation = function (transactionType) {
      $scope.editConfirmation[transactionType] = false;
      $scope.options.confirmation[transactionType] = $scope.optionsBackup.confirmation[transactionType];
    };

    $scope.cancelEditMaxNetworkFee = function () {
      $scope.editMaxNetworkFee = false;
      $scope.options.max_tx_network_fee = $scope.optionsBackup.max_tx_network_fee;
      $scope.max_tx_network_fee_human = ripple.Amount.from_json($scope.options.max_tx_network_fee).to_human();
    };

    $scope.cancelEditAcctOptions = function () {
      $scope.editAcctOptions = false;
      $scope.options.advanced_feature_switch = $scope.optionsBackup.advanced_feature_switch;
    };

    $scope.$on('$blobUpdate', function () {
      $scope.passwordProtection = !$scope.userBlob.data.persistUnlock;
      $scope.options.confirmation = $scope.userBlob.data.clients.rippletradecom.confirmation;

      // we assume that some fields in Options are updated in rpId service $blobUpdate handler
      $scope.optionsBackup = $.extend(true, {}, Options);
    });

    // Add a new server
    $scope.addServer = function () {
      // Create a new server line
      if(!$scope.options.server.servers.isEmptyServer)
        $scope.options.server.servers.push({isEmptyServer: true, secure: false});

      // Set editing to true
      $scope.editing = true;

      // Notify the user on save later
      $scope.success.addServer = true;
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

        // Notify the user
        $scope.success.removeServer = true;
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

        // Notify the user
        $scope.success.saveServer = true;

        // Reload
        // A force reload is necessary here because we have to re-initialize
        // the network object with the new server list.
        location.reload();
      };
    }
  ]);
};

module.exports = AdvancedTab;
