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
    
    $scope.reset = function()
    {
      $scope.username = '';
      $scope.master = '';
      $scope.mode = 'form';
      $scope.showMasterKeyInput = false;
      $scope.submitLoading = false;
    };
    
    $scope.reset();
    
    $scope.submitForm = function() {
      // Disable submit button
      $scope.submitLoading = true;
      $authflow.recoverBlob($scope.username, $scope.masterkey, function (err, blob){
        console.log(err, blob);
      });
    };
        
  }]);
};

module.exports = RecoverTab;