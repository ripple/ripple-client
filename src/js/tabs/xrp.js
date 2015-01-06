var util = require('util'),
    Tab = require('../client/tab').Tab;

var XrpTab = function ()
{
  Tab.call(this);
};

util.inherits(XrpTab, Tab);

XrpTab.prototype.tabName = 'xrp';
XrpTab.prototype.mainMenu = 'fund';

XrpTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

XrpTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/xrp.jade')();
};


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
