var util = require('util'),
    webutil = require('../util/web'),
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
  module.controller('PretendCtrl', ['$rootScope', '$scope', 'rpId', '$q',
                                     function ($rootScope, $scope, $id, $q)
  {

    if (!$id.loginStatus) return $id.goId();

    /**
     * 
     */
    $scope.pretend = function () {
      console.log('pretended as ' + $scope.pretendAs);
      var gotAddress;
      var id = $id;
      // Trying to preted to a Ripple name
      var rippleName = webutil.isRippleName($scope.pretendAs);
      if (rippleName) {
        var d = $q.defer();
        gotAddress = d.promise;
        ripple.AuthInfo.get(Options.domain, $scope.pretendAs, function(err, response) {
          d.resolve(response.address);
        });
      } else {
        gotAddress = $q.when($scope.pretendAs);
      }

      gotAddress.then(function(address) {
        $id.setAccount(address);
        $id.setUsername(address);
        var promise = $id.resolveName(address);
        promise.then(function(name) {
          $id.setUsername(name);
        }, function(err) {
          console.log(err);
        });
        $rootScope.address = address;
        $rootScope.pretended = true;
      });
      
    };

  }]);
};

module.exports = PretendTab;
