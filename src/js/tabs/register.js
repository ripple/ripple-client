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

RegisterTab.prototype.angular = function (module) {
  var app = this.app;
  var tm = this.tm;

  module.controller('RegisterCtrl', function ($scope)
  {
    $scope.reset = function()
    {
      $scope.username = '';
      $scope.password = '';
      $scope.password1 = '';
      $scope.password2 = '';
      $scope.key = '';
      $scope.mode = 'form';

      $scope.registerForm.$setPristine();
    }

    $scope.submitForm = function()
    {
      app.id.login($scope.username, $scope.password1, function(error,success){
        if (error) {
          app.id.register($scope.username, $scope.password1, function(key){
            $scope.username = $scope.username;
            $scope.password = Array($scope.password1.length+1).join("*");
            $scope.key = key;

            $scope.mode = 'welcome';
            $scope.$digest();
          });
        }
        if (success) {
          $scope.mode = 'form';
          $scope.reset();

          tm.gotoTab('overview');
        }
      });
    }

    $scope.showPassword = function()
    {
      $scope.password = $scope.password1;
    }

    $scope.reset();
  })
};

module.exports = RegisterTab;
