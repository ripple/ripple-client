var util = require('util'),
    Tab = require('../client/tab').Tab;

var PretendTab = function ()
{
  Tab.call(this);
};

util.inherits(PretendTab, Tab);

PretendTab.prototype.tabName = 'pretend';
PretendTab.prototype.mainMenu = 'pretend';

PretendTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

PretendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/pretend.jade')();
};


PretendTab.prototype.angular = function (module)
{
  module.controller('PretendCtrl', ['$rootScope', '$scope', 'rpId',
                                     function ($rootScope, $scope, $id)
  {

    if (!$id.loginStatus) return $id.goId();

    /**
     * 
     */
    $scope.pretend = function () {
      console.log('pretended as ' + $scope.pretendAs);
      var id = $id;
      $id.setAccount($scope.pretendAs);
      $id.setUsername($scope.pretendAs);
      var promise = $id.resolveName($scope.pretendAs);
      promise.then(function(name) {
        $id.setUsername(name);
      }, function(err) {
        console.log(err);
      });
      $rootScope.address = $scope.pretendAs;
      $rootScope.pretended = true;
    };

  }]);
};

module.exports = PretendTab;
