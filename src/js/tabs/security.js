var util = require('util');
var Tab  = require('../client/tab').Tab;

var SecurityTab = function ()
{
  Tab.call(this);
};

util.inherits(SecurityTab, Tab);

SecurityTab.prototype.mainMenu = 'wallet';

SecurityTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/security.jade')();
};

SecurityTab.prototype.angular = function (module) {
  module.controller('SecurityCtrl', ['$scope', 'rpId', 'rpOldBlob', 'rpTracker',
                                     function ($scope, $id, $blob, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.$watch('userBlob', updateEnc, true);

    function updateEnc()
    {
      if ("string" === typeof $id.username &&
          "string" === typeof $id.password &&
          $scope.userBlob) {
        $scope.enc = $blob.enc($id.username.toLowerCase(), $id.password, $scope.userBlob);
      }
    }

    $rpTracker.track('Page View', {'Page Name': 'Security'});
  }]);
};

module.exports = SecurityTab;
