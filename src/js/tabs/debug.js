var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab;

var PretendTab = function ()
{
  Tab.call(this);
};

util.inherits(PretendTab, Tab);

PretendTab.prototype.tabName = 'debug';
PretendTab.prototype.mainMenu = 'debug';

PretendTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

PretendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/debug.jade')();
};


PretendTab.prototype.angular = function (module)
{
  module.controller('DebugPretendCtrl', ['$rootScope', '$scope', 'rpId', '$q',
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

        // just dummy object, so no one can operate on blob
        var dummyBlob = {
            data: {
              contacts: [],
              preferred_issuer: {},
              preferred_second_issuer: {}
            },
            meta: [],
            set: function() {},
            unset: function() {},
            unshift: function() {},
            filter: function() {}
          };

        $rootScope.userBlob = dummyBlob;
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
