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

RecoverTab.prototype.angular = function (module) {
  module.controller('RecoverCtrl', ['$scope', '$element', '$routeParams',
                                  '$location', 'rpId', '$rootScope',
                                  'rpPopup', '$timeout', 'rpTracker', 'rpAuthFlow',
                                  function ($scope, $element, $routeParams,
                                            $location, $id, $rootScope,
                                            popup, $timeout, $rpTracker, $authflow) {

    /**
     * User is already logged in
     */
    if ($id.loginStatus) {
      $location.path('/balance');
      return;
    }
    
    var recoveredBlob;
    

    $scope.username      = '';
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
        $authflow.recoverBlob($scope.username, $scope.masterkey, function (err, blob){
          $scope.submitLoading = false;
           
          if (err) {
            $scope.recoverError = err.message || err;
            return;
          }       
          
          recoveredBlob       = blob;
          $scope.mode         = 'setPassword';
          $scope.recoverError = null; //clear any existing errors
        });
        
      } else if ($scope.mode === 'setPassword') {
      
        var options = {
          username  : $scope.username,
          password  : $scope.password1,
          masterkey : $scope.masterkey,
          blob      : recoveredBlob
        }
      
        $id.changePassword(options, function(err, resp) {
          $scope.submitLoading = false;
          
          if (err) {
            $scope.passwordError = err.message || err;
            return;
          }
          
          $scope.mode          = 'continue';
          $scope.passwordError = null;       
        });
      }    
    };
    
    $scope.loadWallet = function () {
      /*
      var keys = {
        id    : recoveredBlob.id, 
        crypt : recoveredBlob.key
      };
      
      $id.storeLoginKeys(recoveredBlob.url, $scope.username, keys);
      $id.loginStatus = true; 
      */    
      $location.path('/balance');
      return;     
    };    
  }]);
};

module.exports = RecoverTab;