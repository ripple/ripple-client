var util = require('util'),
    Tab = require('../client/tab').Tab;

   

var NotFoundTab = function ()
{
  Tab.call(this);
};

util.inherits(NotFoundTab, Tab);

NotFoundTab.prototype.tabName = '404';
NotFoundTab.prototype.mainMenu = 'none';

NotFoundTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

NotFoundTab.prototype.generateHtml = function ()
{

  return require('../../jade/tabs/404.jade')();
};

NotFoundTab.prototype.angular = function (module)
{
  

  module.controller('NotFoundCtrl', ['$rootScope', 'rpId', 'rpNetwork', '$filter', '$http', 'rpAppManager',
                                     function ($scope, $id, $network, $filter, $http, appManager)
  {

  }]);

  
};


module.exports = NotFoundTab;
  

