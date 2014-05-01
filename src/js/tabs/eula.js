var util = require('util');
var Tab = require('../client/tab').Tab;

var EulaTab = function ()
{
  Tab.call(this);
};

util.inherits(EulaTab, Tab);

EulaTab.prototype.tabName = 'eula';
EulaTab.prototype.pageMode = 'single';
EulaTab.prototype.parent = 'main';

EulaTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/eula.jade')();
};

EulaTab.prototype.angular = function (module) {
  module.controller('EulaCtrl', ['$scope', '$element',
                                  function ($scope, $element)
  {

    angular.element('nav').hide();

  }]);

};



module.exports = EulaTab;
