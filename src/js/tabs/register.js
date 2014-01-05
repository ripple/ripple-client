var util = require('util');
var Tab = require('../client/tab').Tab;

var RegisterTab = function ()
{
  Tab.call(this);
};

util.inherits(RegisterTab, Tab);

RegisterTab.prototype.tabName = 'register';
RegisterTab.prototype.pageMode = 'single';
RegisterTab.prototype.parent = 'main';

RegisterTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/register.jade')();


};

RegisterTab.prototype.angular = function (module) {
  module.controller('RegisterCtrl', ['$scope', '$location', '$element', 'rpId', 'rpTracker',
                                     function ($scope, $location, $element, $id, $rpTracker)
  {
    if ($id.loginStatus) {
      $location.path('/balance');
      return;
    }

    $scope.reset = function()
    {
      $scope.username = '';
      $scope.password = '';
      $scope.passwordSet = {};
      $scope.password1 = '';
      $scope.password2 = '';
      $scope.master = '';
      $scope.key = '';
      $scope.mode = 'form';
      $scope.showMasterKeyInput = false;
      $scope.submitLoading = false;
      $scope.track = true;

      if ($scope.registerForm) $scope.registerForm.$setPristine(true);
    };

    $scope.register = function()
    {
      $id.register($scope.username, $scope.password1, function(err, key){
        if (err) {
          // XXX Handle error!
        }
        $scope.password = new Array($scope.password1.length+1).join("*");
        $scope.keyOpen = key;
        $scope.key = $scope.keyOpen[0] + new Array($scope.keyOpen.length).join("*");

        $scope.mode = 'welcome';
      }, $scope.masterkey);
    };

    var updateFormFields = function(){
      var username;
      var password1;
      var password2;

      username = $element.find('input[name="register_username"]').eq(0).val();
      password1 = $element.find('input[name="register_password1"]').eq(0).val();
      password2 = $element.find('input[name="register_password2"]').eq(0).val();

      if ("string" === typeof username) {
        $scope.registerForm.register_username.$setViewValue(username);
      }
      if ("string" === typeof password1) {
        $scope.registerForm.register_password1.$setViewValue(password1);
      }
      if ("string" === typeof password2) {
        $scope.registerForm.register_password2.$setViewValue(password2);
      }
    };

    /**
     * Registration cases
     *
     * -- CASE --                                                            -- ACTION --
     * 1. username or/and password is/are missing ----------------------------- show error
     * 2. passwords do not match ---------------------------------------------- show error
     * 3. username and password passed the validation
     *    3.1 master key is not present
     *        3.1.1 account exists
     *              3.1.1.1 and we can login ---------------------------------- login
     *              3.1.1.2 and we can't login -------------------------------- show error
     *        3.1.2 account doesn't exist ------------------------------------- register and generate master key
     *    3.3 master key is present
     *        3.3.1 account exists, but we can't login ------------------------ show error
     *        3.3.2 account exists and it uses the same master key =----------- login
     *        3.3.3 account exists, and it uses another master key
     *              3.3.2.1 master key is valid ------------------------------- tell him about the situation, and let him decide what to do
     *              3.3.2.2 master key is invalid ----------------------------- show error
     *        3.3.3 account doesn't exist ------------------------------------- register with given master key
     */

    $scope.submitForm = function()
    {
      // Disable submit button
      $scope.submitLoading = true;

      updateFormFields();

      var regInProgress;

      $id.exists($scope.username, $scope.password1, function (error, exists) {
        if (!regInProgress) {
          if (!exists) {
            regInProgress = true;

            if (Options.mixpanel) {
              // XXX You should never modify the Options object!!
              Options.mixpanel.track = $scope.track;
            }

            if (!store.disabled) {
              store.set('ripple_settings', JSON.stringify(Options));
            }

            $scope.register();
          } else {
            $scope.mode = 'alreadyexists';
          }
        }
      });
    };

    $scope.goToBalance = function()
    {
      $scope.mode = 'form';
      $scope.reset();

      $rpTracker.track('Sign Up', {
        'Used key': !!$scope.masterkey,
        'Password strength': $scope.strength,
        'Showed secret key': !!$scope.showSecret,
        'Showed password': !!$scope.showPassword
      });

      $location.path('/balance');
    };

    $scope.reset();
  }]);
};

module.exports = RegisterTab;
