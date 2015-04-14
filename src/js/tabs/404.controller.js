var util = require('util'),
    Tab = require('../client/tab').Tab;

var NotFoundTab = function ()
{
  Tab.call(this);
};

util.inherits(NotFoundTab, Tab);

NotFoundTab.prototype.tabName = '404';
NotFoundTab.prototype.mainMenu = 'none';

NotFoundTab.prototype.angular = function (module)
{
  module.controller('NotFoundCtrl', ['$scope', function ($scope)
  {

  }]);
};

module.exports = NotFoundTab;