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

    // History collection
    $scope.history = [];

    // Open/close states of individual history items
    $scope.details = [];

    // Currencies from history
    var historyCurrencies = [];

    // Filters
    $scope.filters = {
      'currencies': {},
      'types': []
    };

    // All the currencies that we have
    $scope.$watch('balances', function(){
      updateCurrencies();
    });

    // Currency filter has been changed
    $scope.$watch('filters.currencies', function(){
      updateHistory();
    }, true);

    // New transactions
    $scope.$watch('events',function(){
      updateHistory();

      // Update currencies
      updateCurrencies();
    },true);

    // Updates the history collection
    var updateHistory = function (){
      $scope.history = [];
      var currencies = _.map($scope.filters.currencies,function(obj,key){return obj.checked ? key : false});
      $scope.events.forEach(function(event){
        if (event.balance_changer) {
          // Update currencies
          historyCurrencies = _.union(historyCurrencies, event.affected_currencies);
          // Push events to history collection
          if (_.intersection(currencies,event.affected_currencies).length > 0)
            $scope.history.push(event);
        }
      });
    };

    // Update the currency list
    var updateCurrencies = function (){
      var currencies = _.union(
        _.map($scope.balances,function(obj,key){return key.toUpperCase()}),
        historyCurrencies
      );

      var objCurrencies = {};

      var firstProcess = $.isEmptyObject($scope.filters.currencies);

      _.each(currencies, function(currency){
        objCurrencies[currency] = {'checked':($scope.filters.currencies[currency] && $scope.filters.currencies[currency].checked) || firstProcess};
      });

      $scope.filters.currencies = objCurrencies;
    };
  }]);
};

module.exports = HistoryTab;
