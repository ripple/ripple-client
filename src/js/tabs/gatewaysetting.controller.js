var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    settings = require('../util/settings'),
    Currency = ripple.Currency;

var GatewayTab = function ()
{
  Tab.call(this);
};

util.inherits(GatewayTab, Tab);

GatewayTab.prototype.tabName = 'gatewaysettings';
GatewayTab.prototype.mainMenu = 'gatewaysettings';

GatewayTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/gatewaysettings.jade')();
};

GatewayTab.prototype.angular = function(module)
{
  module.controller('GatewaySettingsCtrl', ['$scope', 'rpId', 'rpKeychain', 'rpNetwork',
                                    function ($scope, id, keychain, network)
  {

    $scope.options = Options;
    $scope.optionsBackup = $.extend(true, {}, Options);
    $scope.editConfirmation = {
      send: false,
      exchange: false,
      trade: false
    };
    $scope.edit = {
      advanced_feature_switch: false,
      defaultRippleFlag: false
    };
    $scope.advancedFeatureSwitchChanged = false;
    $scope.confirmationChanged = {
      send: false,
      exchange: false,
      trade: false
    };

    $scope.options.rippling_feature = false;
    $scope.toggleRipplingEdit = false;

    $scope.editRippling = function () {
      $scope.toggleRipplingEdit = true;
    };

    // Initialize the notification object
    $scope.success = {};

    $scope.save = function(type) {
      switch (type) {
        case 'advanced_feature_switch':
          // Ignore it if we are not going to change anything
          if (!$scope.advancedFeatureSwitchChanged) {
            $scope.edit[type] = false;
            return;
          }
          $scope.advancedFeatureSwitchChanged = false;
          $scope.userBlob.set('/clients/rippletradecom/trust/advancedMode', $scope.options.advanced_feature_switch);
          break;
        case 'defaultRippleFlag':
          // Need to set flag on account_root
          var tx = network.remote.transaction();
          tx.accountSet(id.account);
          tx.setFlags('DefaultRipple');

          keychain.requestSecret(id.account, id.username, function (err, secret) {
            if (err) {
              console.log('Error: ', err);
              return;
            }
            tx.secret(secret);
            tx.submit();
          });
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
      } else if (type === 'rippling') {
        $scope.toggleRipplingEdit = false;
      } else {
        $scope.options[type] = $scope.optionsBackup[type];
      }
    };

    $scope.cancelEditConfirmation = function(transactionType) {
      $scope.editConfirmation[transactionType] = false;
      $scope.options.confirmation[transactionType] = $scope.optionsBackup.confirmation[transactionType];
    };
  }]);
}

module.exports = GatewayTab;
