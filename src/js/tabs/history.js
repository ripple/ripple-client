var util = require('util');
var Tab = require('../client/tabmanager').Tab;
var id = require('../client/id').Id.singleton;

var HistoryTab = function ()
{
  Tab.call(this);
};

util.inherits(HistoryTab, Tab);

HistoryTab.prototype.parent = 'wallet';

HistoryTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/history.jade')();
};

HistoryTab.prototype.angular = function (module) {
  module.controller('HistoryCtrl', ['$scope',
                                    function ($scope) {
  }]);
};

module.exports = HistoryTab;
