var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var RegisterTab = function ()
{
  Tab.call(this);
};

util.inherits(RegisterTab, Tab);

RegisterTab.prototype.pageMode = 'single';
RegisterTab.prototype.parent = 'main';

RegisterTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/register.jade')();
};

RegisterTab.prototype.angularDeps = ['directives'];

RegisterTab.prototype.angular = function (module) {
  var app = this.app;
  var tm = this.tm;

  module.controller('RegisterCtrl', function ($scope)
  {
    $scope.submitForm = function()
    {
      app.id.register($scope.username, $scope.password1, function(){
        tm.gotoTab('my-ripple');
      });
    }
  })
};

module.exports = RegisterTab;
