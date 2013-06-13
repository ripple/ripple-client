var util = require('util');
var Tab = require('../client/tab').Tab;

var HistoryTab = function ()
{
  Tab.call(this);
};

util.inherits(HistoryTab, Tab);

HistoryTab.prototype.mainMenu = 'wallet';

HistoryTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/history.jade')();
};

HistoryTab.prototype.angular = function (module) {
  module.controller('HistoryCtrl', ['$scope', 'rpId',
                                     function ($scope, $id)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.history = [];
    $scope.details = [];

    $scope.$watch('events',function(){
      $scope.events.forEach(function(event){
        console.log('event',event);

        if (event.balance_changer)
          $scope.history.push(event);

      });
    },true);
  }]);
};

module.exports = HistoryTab;
