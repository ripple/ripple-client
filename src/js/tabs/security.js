var blob = require('../client/blob').BlobObj;
var util = require('util');
var Tab  = require('../client/tabmanager').Tab;
var id   = require('../client/id').Id.singleton;

var SecurityTab = function ()
{
  Tab.call(this);
};

util.inherits(SecurityTab, Tab);

SecurityTab.prototype.parent = 'wallet';

SecurityTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/security.jade')();
};

SecurityTab.prototype.angular = function (module) {
  var app = this.app;

  module.controller('SecurityCtrl', function ($scope)
  {
    $scope.$watch('userBlob', updateEnc, true);

    function updateEnc()
    {
      $scope.enc = blob.enc(app.id.username, app.id.password, $scope.userBlob);
    }
  });
};

module.exports = SecurityTab;
