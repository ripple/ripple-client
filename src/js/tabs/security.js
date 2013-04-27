var blob = require('../client/blob').BlobObj;
var util = require('util');
var Tab  = require('../client/tab').Tab;
var id   = require('../client/id').Id.singleton;

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
  var app = this.app;

  module.controller('SecurityCtrl', ['$scope', 'rpId',
                                     function ($scope, $id)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.$watch('userBlob', updateEnc, true);

    function updateEnc()
    {
      if ("string" === typeof $id.username &&
          "string" === typeof $id.password &&
          $scope.userBlob) {
        $scope.enc = blob.enc($id.username, $id.password, $scope.userBlob);
      }
    }
  }]);
};

module.exports = SecurityTab;
