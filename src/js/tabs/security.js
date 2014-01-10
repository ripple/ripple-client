var util = require('util');
var Tab  = require('../client/tab').Tab;

var SecurityTab = function ()
{
  Tab.call(this);
};

util.inherits(SecurityTab, Tab);

SecurityTab.prototype.tabName = 'security';
SecurityTab.prototype.mainMenu = 'wallet';

SecurityTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/security.jade')();
};

SecurityTab.prototype.angular = function (module) {
  module.controller('SecurityCtrl', ['$scope', 'rpId', 'rpOldBlob', 'rpTracker',
                                     'rpKeychain',
                                     function ($scope, $id, $blob, $rpTracker,
                                               keychain)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.$watch('userBlob', updateEnc, true);
    updateEnc();

    $scope.security = {};

    function updateEnc()
    {
      if ("function" === typeof $scope.userBlob.encrypt) {
        $scope.enc = $scope.userBlob.encrypt();
      }
    }

    /*
      rp-confirm(
        action-text="Are you in a safe place, where no person, or camera can see your screen?"
        action-button-text="Yes, show me"
        action-function="SecretKeyUnmask=true"
        cancel-button-text="No"
        ng-hide="SecretKeyUnmask")
     */

    $scope.unmaskSecret = function () {
      keychain.requestSecret($id.account, $id.username, function (err, secret) {
        if (err) {
          // XXX Handle error
          return;
        }

        $scope.security.master_seed = secret;
      });
    };
  }]);
};

module.exports = SecurityTab;
