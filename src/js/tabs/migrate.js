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

MigrateTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/migrate.jade')();
};

MigrateTab.prototype.angular = function (module) {
  module.controller('MigrateCtrl', ['$scope', '$location', '$element', 'rpId', 'rpTracker',
                                     function ($scope, $location, $element, $id, $rpTracker)
  {


  }]);
};

module.exports = MigrateTab;
