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
      $scope.master = '';
      $scope.key = '';
      $scope.mode = 'form';
      $scope.showMasterKeyInput = false;
    }

    $scope.register = function()
    {
      app.id.register($scope.username, $scope.password1, function(key){
        console.log('register');
        $scope.password = Array($scope.password1.length+1).join("*");
        $scope.key = key;

        $scope.mode = 'welcome';
        $scope.$digest();
      }, $scope.masterkey);
    }

    /**
     * Registration cases
     *
     * -- CASE --                                                            -- ACTION --
     * 1. username or/and password is/are missing ----------------------------- show error
     * 2. passwords do not match ---------------------------------------------- show error
     * 3. username and password passed the validation
     *    3.1 master key is not present
     *        3.1.1 account exists -------------------------------------------- login
     *        3.1.2 account doesn't exist ------------------------------------- register and generate master key
     *    3.3 master key is present
     *        3.3.1 account exists, and it uses the same master key ----------- login
     *        3.3.2 account exists, and it uses another master key
     *              3.3.2.1 master key is valid ------------------------------- ASK! TODO
     *              3.3.2.2 master key is invalid ----------------------------- show error
     *        3.3.3 account doesn't exist ------------------------------------- register with given master key
     */

    $scope.submitForm = function()
    {
      app.id.login($scope.username, $scope.password1, function(error,success){
        if (!success) {
          $scope.register();
        }
        if (success) {
          if ($scope.masterkey && $scope.masterkey != app.$scope.userCredentials.master_seed) {
            $scope.mode = 'masterkeyerror';
            $scope.$digest();
          } else {
            $scope.goToOverview();
          }
        }
      });
    }

    $scope.goToOverview = function()
    {
      $scope.mode = 'form';
      $scope.reset();

      tm.gotoTab('overview');
    }

    $scope.showPassword = function()
    {
      $scope.password = $scope.password1;
    }

    $scope.reset();
  })
};

module.exports = RegisterTab;