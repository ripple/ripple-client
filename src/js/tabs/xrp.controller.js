var util = require('util'),
    Tab = require('../client/tab').Tab;

var XrpTab = function ()
{
  Tab.call(this);
};

util.inherits(XrpTab, Tab);

XrpTab.prototype.tabName = 'xrp';
XrpTab.prototype.mainMenu = 'fund';

XrpTab.prototype.angular = function (module)
{
  module.controller('XrpCtrl', ['$scope', 'rpId', function ($scope, id)
  {
    $scope.accountLines = {};
    $scope.showComponent = [];
    $scope.fundPage = 'xrp';
  }]);
};

module.exports = XrpTab;
