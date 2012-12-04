var blob = require('../client/blob').BlobObj;
var util = require('util');
var Tab  = require('../client/tabmanager').Tab;
var id   = require('../client/id').Id.singleton;

var InfoTab = function ()
{
  Tab.call(this);
};

util.inherits(InfoTab, Tab);

InfoTab.prototype.parent = 'account';

InfoTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/info.jade')();
};

InfoTab.prototype.angular = function (module) {
  var app = this.app;

  module.controller('InfoCtrl', function ($scope)
  {
    $scope.updateData = function ()
    {
      $scope.username = app.id.username;
      $scope.password = Array(app.id.password.length+1).join("•");
      $scope.master = app.id.data.data.master_seed;
      $scope.wallet = blob.enc(app.id.username,app.id.password,app.id.data);
    }

    // Update info when user enters this tab
    if (app.id.data) {
      $scope.updateData();
    }

    // Update info when blob is updated
    app.id.on('blobupdate', function (e) {
      $scope.updateData();
      $scope.$digest();
    })


  })
};

module.exports = InfoTab;
