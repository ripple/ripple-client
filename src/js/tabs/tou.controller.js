var util = require('util');
var Tab = require('../client/tab').Tab;

var TouTab = function ()
{
  Tab.call(this);
};

util.inherits(TouTab, Tab);

TouTab.prototype.tabName = 'tou';
TouTab.prototype.pageMode = 'single';
TouTab.prototype.parent = 'main';

TouTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/tou.jade')();
};

TouTab.prototype.angular = function (module) {
  module.controller('TouCtrl', ['$scope', '$element',
                                  function ($scope, $element)
  {

    angular.element('nav').hide();

  }]);

};



module.exports = TouTab;
