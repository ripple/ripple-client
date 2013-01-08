var blob = require('../client/blob').BlobObj;
var util = require('util');
var Tab  = require('../client/tabmanager').Tab;
var id   = require('../client/id').Id.singleton;

var InfoTab = function ()
{
  Tab.call(this);
};

util.inherits(InfoTab, Tab);

InfoTab.prototype.parent = 'wallet';

InfoTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/info.jade')();
};

InfoTab.prototype.angular = function (module) {
  var app = this.app;

  module.controller('InfoCtrl', function ($scope)
  {
    $scope.$watch('userBlob', updateEnc, true);

    function updateEnc()
    {
      $scope.enc = blob.enc(app.id.username, app.id.password, $scope.userBlob);
    }
  });
};

module.exports = InfoTab;
