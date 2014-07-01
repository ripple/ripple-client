var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;

var OptionsTab = function ()
{
  Tab.call(this);
};

util.inherits(OptionsTab, Tab);

OptionsTab.prototype.tabName = 'options';
OptionsTab.prototype.mainMenu = 'advanced';

OptionsTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/options.jade')();
};

OptionsTab.prototype.angular = function(module)
{
  module.controller('OptionsCtrl', ['$scope', '$rootScope', 'rpId', 'rpKeychain',
                                    function ($scope, $rootScope, $id, $keychain)
  {
    
    $scope.options = Options;
    $scope.passwordProtection = !$scope.userBlob.data.persistUnlock;
    
    $scope.save = function () {
      // Save in local storage
      if (!store.disabled) {
        store.set('ripple_settings', JSON.stringify($scope.options));
      }

      // Reload
      location.reload();
    };
    $scope.$on('$blobUpdate', function(){
      $scope.passwordProtection = !$scope.userBlob.data.persistUnlock;
    });
    
    $scope.setPasswordProtection = function () {
      $keychain.setPasswordProtection(!$scope.passwordProtection, function(err, resp){
        console.log(err, resp);
        if (err) {
          $scope.passwordProtection = !$scope.PasswordProtection;
          console.log($scope.passwordProtection);
        }
      });
    };
  }]);
};

module.exports = OptionsTab;
