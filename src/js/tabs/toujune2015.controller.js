var util = require('util');
var Tab = require('../client/tab').Tab;

var TouJune2015Tab = function ()
{
  Tab.call(this);
};

util.inherits(TouJune2015Tab, Tab);

TouJune2015Tab.prototype.tabName = 'tou-june-2015';
TouJune2015Tab.prototype.pageMode = 'single';
TouJune2015Tab.prototype.parent = 'main';

TouJune2015Tab.prototype.angular = function (module) {
  module.controller('TouJune2015Ctrl', ['$scope', '$element',
                                  function ($scope, $element)
  {

    angular.element('nav').hide();

  }]);

};



module.exports = TouJune2015Tab;
