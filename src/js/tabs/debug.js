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
                                     function ($rootScope, $scope, id, $q)
  {
    $scope.pretend = {
      pretendAs: '',
      address: ''
    };

    if ($rootScope.original_contacts) {
      $scope.pretend_query = webutil.queryFromContacts($rootScope.original_contacts);
    }

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      if (contacts && contacts.length > 0) {
        $scope.pretend_query = webutil.queryFromContacts(contacts);
        $rootScope.original_contacts = contacts;
      }
    }, true);

    $scope.$watch('pretend.pretendAs', function(rec){
        $scope.resolveInput();
    });

    $scope.resolveInput = function () {
      if (!$rootScope.original_contacts) {
        $rootScope.original_contacts = [];
      }

      var contact = webutil.getContact($rootScope.original_contacts, $scope.pretend.pretendAs);
      console.log('got contact ' + contact);
      var gotAddress;

      if (contact) {
        $scope.pretend.address = contact.address;
        gotAddress = $q.when(contact.address);
      }
      else if (webutil.isRippleName($scope.pretend.pretendAs)) {
        var d = $q.defer();
        gotAddress = d.promise;
        rippleVaultClient.AuthInfo.get(Options.domain, $scope.pretend.pretendAs, function(err, response) {
          $scope.pretend.address = response.address;
          d.resolve(response.address);
        });
      }
      else {
        gotAddress = $q.when($scope.pretend.pretendAs);
        $scope.pretend.address = $scope.pretend.pretendAs;
        $scope.address = $scope.pretend.pretendAs;
      }
      return gotAddress;
    };

    $scope.pretend = function () {
      console.log('debug as ' + $scope.pretend.pretendAs);

      var gotAddress = $scope.resolveInput();

      gotAddress.then(function(address) {
        id.setAccount(address);

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

        $rootScope.userHistory = null;
        $rootScope.userBlob = dummyBlob;
        id.setUsername(address);

        var promise = id.resolveName(address);
        promise.then(function(name) {
          id.setUsername(name);
        }, function(err) {
          console.log(err);
        });
        $rootScope.address = address;
        $rootScope.debug = true;
      });
      
    };

  }]);
};

module.exports = PretendTab;
