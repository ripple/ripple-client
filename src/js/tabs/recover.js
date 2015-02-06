var util     = require('util');
var Tab      = require('../client/tab').Tab;

var RecoverTab = function ()
{
  Tab.call(this);
};

util.inherits(RecoverTab, Tab);

RecoverTab.prototype.tabName = 'recover';
RecoverTab.prototype.pageMode = 'single';
RecoverTab.prototype.parent = 'main';

RecoverTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/recover.jade')();
};

RecoverTab.prototype.extraRoutes = [
  { name: '/recover/:username' }
];

RecoverTab.prototype.angular = function (module) {
  module.controller('RecoverCtrl', ['$scope', '$element', '$routeParams',
                                  '$location', 'rpId', '$rootScope',
                                  'rpPopup', '$timeout', 'rpTracker', 'rpAuthFlow',
                                  function ($scope, $element, $routeParams,
                                            $location, id, $rootScope,
                                            popup, $timeout, rpTracker, authflow) {

    /**
     * User is already logged in
     */
    if (id.loginStatus) {
      $location.path('/balance');
      return;
    }

    var recoveredBlob;

    $scope.username      = $routeParams.username;
    $scope.masterkey     = '';
    $scope.mode          = 'recover';
    $scope.submitLoading = false;
    $scope.passwordSet   = {};
    $scope.password1     = '';
    $scope.password2     = '';
    $scope.recoverError  = null;
    $scope.passwordError = null;

    $scope.submitForm = function() {

      // Disable submit button
      $scope.submitLoading = true;

      if ($scope.mode === 'recover') {
        authflow.recoverBlob($scope.username, $scope.masterkey, function (err, blob){
          $scope.submitLoading = false;

          if (err) {
            rpTracker.track('Recover Blob', {
              'Status': 'error',
              'Message': err.message
            });

            var message = err.message || err;
            if (err.message == 'Invalid ECDSA signature') {
              message = 'Please check your secret key ';
            }

            $scope.recoverError = message;
            return;
          }

          rpTracker.track('Recover Blob', {
            result: 'success'
          });

          recoveredBlob       = blob;
          $scope.username     = blob.username;
          $scope.mode         = 'setPassword';
          $scope.recoverError = null; //clear any existing errors
        });

      } else if ($scope.mode === 'setPassword') {

        var options = {
          username  : $scope.username,
          password  : $scope.password1,
          masterkey : $scope.masterkey,
          blob      : recoveredBlob
        };

        id.changePassword(options, function(err, resp) {
          $scope.submitLoading = false;

          if (err) {
            rpTracker.track('Change Password', {
              'Status': 'error',
              'Message': err.message
            });

            $scope.passwordError = err.message || err;
            return;
          }

          rpTracker.track('Change Password', {
            result: 'success'
          });

          $rootScope.recovered = true;
          $location.path('/balance');
        });
      }
    };
  }]);
};

module.exports = RecoverTab;
