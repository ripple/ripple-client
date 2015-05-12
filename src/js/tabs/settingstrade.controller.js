(function(module) {
'use strict';

/* global ripple: false, angular: false, _: false, jQuery: false, store: false, Options: false */

var util = require('util'),
    webutil = require('../util/web'),
    settings = require('../util/settings'),
    Tab = require('../client/tab').Tab;

var SettingsTradeTab = function() {
  Tab.call(this);
};

util.inherits(SettingsTradeTab, Tab);

SettingsTradeTab.prototype.tabName = 'settingstrade';
SettingsTradeTab.prototype.mainMenu = 'settingstrade';

SettingsTradeTab.prototype.angular = function(module) {
  module.controller('SettingsTradeCtrl', SettingsTradeCtrl);

  SettingsTradeCtrl.$inject = ['$scope', '$timeout'];

  function SettingsTradeCtrl($scope, $timeout) {
    if ($scope.userBlob.data && $scope.userCredentials.username) {
      $scope.pairs = settings.getSetting($scope.userBlob, 'trade_currency_pairs');
    } else {
      var removeWatcher = $scope.$on('$blobUpdate', function() {
        if (!$scope.userCredentials.username)
          return;
        $scope.pairs = settings.getSetting($scope.userBlob, 'trade_currency_pairs');
        removeWatcher();
      });
    }

    $scope.deletePair = function(index){
      for (var i = 0; i < $scope.pairs.length; i++) {
        if ($scope.pairs[i].name === this.entry.name) {
          $scope.userBlob.unset('/clients/rippletradecom/trade_currency_pairs/' + index);
          return;
        }
      }
    }

    $scope.dragControlListeners = {
        orderChanged: function(event) {
          var sourceObj = _.clone($scope.pairs[event.source.index]);
          var destObj = _.clone($scope.pairs[event.dest.index]);
          $scope.userBlob.set('/clients/rippletradecom/trade_currency_pairs/' + event.source.index, sourceObj);
          $scope.userBlob.set('/clients/rippletradecom/trade_currency_pairs/' + event.dest.index, destObj);
        }
    };
  }
};

module.exports = SettingsTradeTab;

})(module);
