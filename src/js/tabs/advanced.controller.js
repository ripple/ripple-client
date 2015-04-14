var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    settings = require('../util/settings'),
    Currency = ripple.Currency;

var AdvancedTab = function ()
{
  Tab.call(this);
};

util.inherits(AdvancedTab, Tab);

AdvancedTab.prototype.tabName = 'advanced';
AdvancedTab.prototype.mainMenu = 'advanced';

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
    $scope.passwordProtection = !settings.getSetting($scope.userBlob, 'persistUnlock', false);
    $scope.editConfirmation = {
      send: false,
      exchange: false,
      trade: false
    };
    $scope.edit = {
      blobvault: false,
      maxNetworkFee: false,
      historyApi: false
    };
    $scope.max_tx_network_fee_human = ripple.Amount.from_json($scope.options.max_tx_network_fee).to_human();
    $scope.confirmationChanged = {
      send: false,
      exchange: false,
      trade: false
    };

    // Initialize the notification object
    $scope.success = {};

    $scope.save = function(type) {
      switch (type) {
        case 'maxNetworkFee':
          $scope.options.max_tx_network_fee = ripple.Amount.from_human($scope.max_tx_network_fee_human).to_json();
          $scope.userBlob.set('/clients/rippletradecom/maxNetworkFee', $scope.options.max_tx_network_fee);
          // This has to be updated manually because the network object is not
          // recreated unless we do location.reload()
          network.remote.max_fee = $scope.options.max_tx_network_fee;
          break;
        case 'historyApi':
          $scope.userBlob.set('/clients/rippletradecom/historyApi', $scope.options.historyApi.replace(/[\/]*$/, ''));
          break;
        default:
          // Save in local storage
          if (!store.disabled) {
            store.set('ripple_settings', JSON.stringify($scope.options));
          }
      }

      $scope.edit[type] = false;

      if (type === 'blobvault') {
        location.reload();
      }

      // Notify the user
      $scope.success[type] = true;
    };

    $scope.saveConfirmation = function(transactionType) {
      // ignore it if we are not going to change anything
      if (!$scope.confirmationChanged[transactionType]) {
        $scope.editConfirmation[transactionType] = false;
        return;
      }
      $scope.confirmationChanged[transactionType] = false;

      $scope.userBlob.set('/clients/rippletradecom/confirmation', $scope.options.confirmation);

      $scope.editConfirmation[transactionType] = false;
      // Notify the user
      $scope.success.saveConfirmation[transactionType] = true;
    };

    $scope.deleteUrl = function(type) {
      if (type === 'blobvault') {
        $scope.options.blobvault = '';
      }
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    };

    $scope.cancelEdit = function(type) {
      $scope.edit[type] = false;
      if (type === 'maxNetworkFee') {
        $scope.options.max_tx_network_fee = $scope.optionsBackup.max_tx_network_fee;
        $scope.max_tx_network_fee_human = ripple.Amount.from_json($scope.options.max_tx_network_fee).to_human();
      }
      else {
        $scope.options[type] = $scope.optionsBackup[type];
      }
    };

    $scope.cancelEditConfirmation = function(transactionType) {
      $scope.editConfirmation[transactionType] = false;
      $scope.options.confirmation[transactionType] = $scope.optionsBackup.confirmation[transactionType];
    };

    $scope.$on('$blobUpdate', function() {
      $scope.passwordProtection = !settings.getSetting($scope.userBlob, 'persistUnlock', false);

      // we assume that some fields in Options are updated in rpId service $blobUpdate handler
      $scope.optionsBackup = $.extend(true, {}, Options);

      // still assuming that fields in Options have been updated in rpId service $blobUpdate handler
      $scope.max_tx_network_fee_human = ripple.Amount.from_json($scope.options.max_tx_network_fee).to_human();
    });

    // Add a new server
    $scope.addServer = function() {
      // Create a new server line
      if (!$scope.options.server.servers.isEmptyServer)
        $scope.options.server.servers.push({isEmptyServer: true, secure: true});

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
        $scope.options.server.servers.splice($scope.index, 1);

        $scope.persist();

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

        // Determine port if empty
        if (!$scope.server.port) {
          $scope.server.port = $scope.server.secure ? '443' : '80'
        }

        $scope.persist(function() {
          // Reload
          // A force reload is necessary here because we have to re-initialize
          // the network object with the new server list.
          location.reload();
        });

        // Notify the user
        $scope.success.saveServer = true;
      };

      $scope.persist = function(cb) {
        // Save in local storage
        if (!store.disabled) {
          store.set('ripple_settings', JSON.stringify($scope.options));
        }
        var servers = settings.getClearServers($scope.options.server.servers);
        $scope.userBlob.set('/clients/rippletradecom/server/servers', servers, cb);
      }
    }
  ]);
};

module.exports = AdvancedTab;
