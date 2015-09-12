var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    settings = require('../util/settings'),
    Currency = ripple.Currency;

var SettingsGatewayTab = function ()
{
  Tab.call(this);
};

util.inherits(SettingsGatewayTab, Tab);

SettingsGatewayTab.prototype.tabName = 'settingsgateway';
SettingsGatewayTab.prototype.mainMenu = 'settingsgateway';

SettingsGatewayTab.prototype.angular = function(module)
{
  module.controller('SettingsGatewayCtrl', ['$scope', 'rpId', 'rpKeychain', 'rpNetwork', 'rpAPI',
                                    function ($scope, id, keychain, network, api)
  {
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
      advanced_feature_switch: false,
      bridge: false,
      defaultRippleFlag: false,
      defaultRippleFlagSaving: false
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
        case 'advanced_feature_switch':
          $scope.userBlob.set('/clients/rippletradecom/trust/advancedMode', $scope.options.advanced_feature_switch);
          break;
        case 'defaultRippleFlag':
          // Need to set flag on account_root only when chosen option is different from current setting
          if ($scope.currentDefaultRipplingFlagSetting !== $scope.isDefaultRippleFlagEnabled) {
            $scope.edit.defaultRippleFlagSaving = true;
            var tx = network.remote.transaction();
            !$scope.isDefaultRippleFlagEnabled ? tx.accountSet(id.account, undefined, 'DefaultRipple') : tx.accountSet(id.account, 'DefaultRipple');
            tx.on('success', function(res) {
              $scope.$apply(function() {
                $scope.edit.defaultRippleFlagSaving = false;
                $scope.load_notification('defaultRippleUpdated');
              });

              api.addTransaction(res.tx_json, {Status: 'success'}, res.tx_json.hash, new Date().toString());
            });
            tx.on('error', function(res) {
              console.warn(res);
              $scope.$apply(function() {
                $scope.edit.defaultRippleFlagSaving = false;
              });

              api.addTransaction(res.tx_json, {Status: 'error'}, res.tx_json.hash, new Date().toString());
            });

            keychain.requestSecret(id.account, id.username, function (err, secret) {
              if (err) {
                console.log('Error: ', err);
                $scope.isDefaultRippleFlagEnabled = !$scope.isDefaultRippleFlagEnabled;
                $scope.edit.defaultRippleFlagSaving = false;
                return;
              }
              tx.secret(secret);
              tx.submit();
            });
          }
          break;
        default:
          // Save in local storage
          if (!store.disabled) {
            store.set('ripple_settings', JSON.stringify($scope.options));
          }
      }

      $scope.edit[type] = false;

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
      if (type === 'bridge') {
        $scope.options.bridge.out.bitcoin = '';
      }

      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }
    };

    $scope.cancelEdit = function(type) {
      $scope.edit[type] = false;
      if (type === 'bridge') {
        $scope.options.bridge.out.bitcoin = $scope.optionsBackup.bridge.out.bitcoin;

      } else {
        $scope.options[type] = $scope.optionsBackup[type];
      }
    };

    $scope.cancelEditConfirmation = function(transactionType) {
      $scope.editConfirmation[transactionType] = false;
      $scope.options.confirmation[transactionType] = $scope.optionsBackup.confirmation[transactionType];
    };

    $scope.$watch('account', function() {
      // Check if account has DefaultRipple flag set
      $scope.isDefaultRippleFlagEnabled = !!($scope.account.Flags & ripple.Remote.flags.account_root.DefaultRipple);
      $scope.currentDefaultRipplingFlagSetting = $scope.isDefaultRippleFlagEnabled;
    }, true);

  }]);
};

module.exports = SettingsGatewayTab;
