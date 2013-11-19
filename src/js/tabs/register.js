var util = require('util');
var Tab = require('../client/tab').Tab;

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
  module.controller('RegisterCtrl', ['$scope', '$location', 'rpId', 'rpTracker',
                                     function ($scope, $location, $id, $rpTracker)
  {
    if ($id.loginStatus) {
      $location.path('/balance');
      return;
    }

    $scope.backendChange = function()
    {
      $id.blobBackends = $scope.blobBackendCollection.something.value.split(',');
      store.set('ripple_blobBackends', $id.blobBackends);
    };

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
      $id.register($scope.username, $scope.password1, function(key){
        $scope.password = new Array($scope.password1.length+1).join("*");
        $scope.keyOpen = key;
        $scope.key = $scope.keyOpen[0] + new Array($scope.keyOpen.length).join("*");

        $scope.mode = 'welcome';
      }, $scope.masterkey);
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

      var regInProgress;

      $id.exists($scope.username, $scope.password1, function (error, exists) {
        if (!regInProgress) {
          if (!exists) {
            regInProgress = true;

            Options.mixpanel.track = $scope.track;

            store.set('ripple_settings', JSON.stringify(Options));

            $scope.register();
          } else {
            $id.login($scope.username, $scope.password1, function (error) {
              $scope.submitLoading = false;
              if (error) {
                // There is a conflicting wallet, but we can't login to it
                $scope.mode = 'loginerror';
              } else if ($scope.masterkey &&
                         $scope.masterkey != $scope.userCredentials.master_seed) {
                $scope.mode = 'masterkeyerror';
              } else {
                $location.path('/balance');
              }
            });
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
        'Blob': $scope.blobBackendCollection.something.name,
        'Showed secret key': $scope.showSecret,
        'Showed password': $scope.showPassword
      });

      $location.path('/balance');
    };

    $scope.reset();

    $rpTracker.track('Page View', {'Page Name': 'Register'});
  }]);
};

module.exports = RegisterTab;
