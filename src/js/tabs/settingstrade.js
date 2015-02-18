(function(module) {
'use strict';

/* global ripple: false, angular: false, _: false, jQuery: false, store: false, Options: false */

var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab;

var SettingsTradeTab = function ()
{
  Tab.call(this);
};

util.inherits(SettingsTradeTab, Tab);

SettingsTradeTab.prototype.tabName = 'settingstrade';
SettingsTradeTab.prototype.mainMenu = 'settingstrade';

SettingsTradeTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/settingstrade.jade')();
};

SettingsTradeTab.prototype.angular = function(module) {
  module.controller('SettingsTradeCtrl', SettingsTradeCtrl);

  SettingsTradeCtrl.$inject = ['$scope', '$timeout'];

  function SettingsTradeCtrl($scope, $timeout) {
    var dirty = false,
        saveTimeout;

    if ($scope.userBlob.data && $scope.userCredentials.username) {
      var d = $scope.userBlob.data;
      $scope.pairs = d.clients && d.clients.rippletradecom && d.clients.rippletradecom.trade_currency_pairs;
    } else {
      var removeWatcher = $scope.$on('$blobUpdate', function() {
        if (!$scope.userCredentials.username)
          return;
        var d = $scope.userBlob.data;
        $scope.pairs = d.clients && d.clients.rippletradecom && d.clients.rippletradecom.trade_currency_pairs;
        removeWatcher();
      });
    }

    $scope.deletePair = function(index){
      for (var i = 0; i < $scope.pairs.length; i++) {
        if ($scope.pairs[i].$$hashKey === this.entry.$$hashKey) {
          saveTradePairs();
          $scope.userBlob.unset('/clients/rippletradecom/trade_currency_pairs/' + index);
          return;
        }
      }
    }

    $scope.dragControlListeners = {
        orderChanged: function(event) {
          dirty = true;
          if (saveTimeout) {
            $timeout.cancel(saveTimeout);
          }
          saveTimeout = $timeout(saveTradePairs, 2000);
        }
    };

    $scope.$on('$destroy', saveTradePairs);

    function saveTradePairs() {
      if (dirty) {
        $timeout.cancel(saveTimeout);
        saveTimeout = null;
        // clear $$hashKey
        var pairs = angular.fromJson(angular.toJson($scope.pairs));
        $scope.userBlob.set('/clients/rippletradecom/trade_currency_pairs', pairs);
        dirty = false;
      }
    }
  }
};

module.exports = SettingsTradeTab;

})(module);
