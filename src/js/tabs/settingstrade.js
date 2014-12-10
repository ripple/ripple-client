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

SettingsTradeTab.prototype.angular = function(module)
{
  module.controller('SettingsTradeCtrl', ['$scope',
    function ($scope)
    {
      if ($scope.userBlob.data){
        $scope.pairs = $scope.userBlob.data.trade_currency_pairs;
      }
      $scope.$on('$blobUpdate', function () {
        $scope.pairs = $scope.userBlob.data.trade_currency_pairs;
      });

      $scope.deletePair = function(index){
        for (var i = 0; i < $scope.pairs.length; i++) {
          if ($scope.pairs[i].$$hashkey == this.entry.$$hashkey) {
            $scope.userBlob.unset('/trade_currency_pairs/' + index);
            return;
          }
        }
      }
    }]);
};

module.exports = SettingsTradeTab;
