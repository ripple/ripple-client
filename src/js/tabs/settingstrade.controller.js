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
      $scope.pairs = _.clone(settings.getSetting($scope.userBlob, 'trade_currency_pairs'));
    } else {
      var removeWatcher = $scope.$on('$blobUpdate', function() {
        if (!$scope.userCredentials.username)
          return;
        $scope.pairs = _.clone(settings.getSetting($scope.userBlob, 'trade_currency_pairs'));
        removeWatcher();
      });
    }

    $scope.deletePair = function(index){
      for (var i = 0; i < $scope.pairs.length; i++) {
        if ($scope.pairs[i].name === this.entry.name) {
          $scope.pairs.splice(i, 1);
          $scope.userBlob.unset('/clients/rippletradecom/trade_currency_pairs/' + index);
          return;
        }
      }
    }

    $scope.dragControlListeners = {
      orderChanged: function(event) {
        var direction = event.dest.index < event.source.index ? 1 : -1;
        var p = event.dest.index;
        var end = event.source.index + direction;
        do {
          var obj = $scope.pairs[p];
          $scope.userBlob.set('/clients/rippletradecom/trade_currency_pairs/' + p, obj);
          p += direction;
        } while (p != end);
      }
    };
  }
};

module.exports = SettingsTradeTab;

})(module);
