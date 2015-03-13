var util = require('util');
var Tab = require('../client/tab').Tab;

var PrivacypolicyTab = function ()
{
  Tab.call(this);
};

util.inherits(PrivacypolicyTab, Tab);

PrivacypolicyTab.prototype.tabName = 'privacypolicy';
PrivacypolicyTab.prototype.pageMode = 'single';
PrivacypolicyTab.prototype.parent = 'main';

PrivacypolicyTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/privacypolicy.jade')();
};

PrivacypolicyTab.prototype.angular = function (module) {
  module.controller('PrivacypolicyCtrl', ['$scope', '$element',
    function ($scope, $element)
    {

      angular.element('nav').hide();

    }]);

};



module.exports = PrivacypolicyTab;