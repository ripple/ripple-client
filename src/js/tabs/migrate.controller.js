var util = require('util');
var Tab = require('../client/tab').Tab;

var MigrateTab = function ()
{
  Tab.call(this);
};

util.inherits(MigrateTab, Tab);

MigrateTab.prototype.tabName = 'migrate';
MigrateTab.prototype.pageMode = 'single';
MigrateTab.prototype.parent = 'main';

MigrateTab.prototype.angular = function (module) {
  module.controller('MigrateCtrl', ['$scope', '$rootScope',
                                  function ($scope, $rootScope)
  {
    window.location.assign('https://www.ripple.com/migrate');
  }]);
};

module.exports = MigrateTab;