var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var LoginTab = function ()
{
  Tab.call(this);
};

util.inherits(LoginTab, Tab);

LoginTab.prototype.pageMode = 'single';
LoginTab.prototype.parent = 'main';

LoginTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/login.jade')();
};

LoginTab.prototype.angularDeps = ['directives'];

LoginTab.prototype.angular = function (module) {
  var tm = this.tm;
  var app = this.app;

  module.controller('LoginCtrl', function ($scope)
  {
    $scope.error = '';

    $scope.submitForm = function()
    {
      app.id.login($scope.username, $scope.password, function(err, success) {
        // XXX: Handle err
        if (success) {
          tm.gotoTab('overview');
        } else {
          $scope.error = 'Username and/or password is wrong';
          $scope.$digest();
        }
      });
    }
  })
};

module.exports = LoginTab;
