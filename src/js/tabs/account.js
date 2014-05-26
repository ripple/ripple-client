var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'advanced';

AccountTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/account.jade')();
};

AccountTab.prototype.angular = function(module)
{
  module.controller('AccountCtrl', ['$scope', '$rootScope', 'rpId', '$timeout',
                                    function ($scope, $rootScope, $id, $timeout)
  {
    $scope.changeName = function() {
      $scope.loading = true;

      $timeout(function(){
        $scope.loading = false;
      }, 1000)
    }
  }]);
};

module.exports = AccountTab;
