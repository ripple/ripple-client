var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base;

var FundTab = function ()
{
  Tab.call(this);
};

util.inherits(FundTab, Tab);

FundTab.prototype.tabName = 'fund';
FundTab.prototype.mainMenu = 'fund';

FundTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/fund.jade')();
};

FundTab.prototype.angular = function (module)
{
  module.controller('FundCtrl', ['$scope', '$timeout', '$routeParams', 'rpId', 'rpNetwork', 'rpTracker',
    function ($scope, $timeout, $routeParams, $id, $network, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

  }]);
};

module.exports = FundTab;
