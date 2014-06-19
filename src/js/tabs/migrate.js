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
  module.controller('MigrateCtrl', ['$scope', '$window',
                                     function ($scope, $window)
  {

    $scope.migrate = function() {

      var RTpath = 'https://rippletrade.com/#/login/migrate';

      $window.location.href = RTpath;
    }

  }]);
};

module.exports = MigrateTab;
