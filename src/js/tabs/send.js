var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var SendTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(SendTab, Tab);

SendTab.prototype.parent = 'main';

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angular = function (module)
{
  var app = this.app;
  module.controller('SendCtrl', function ($scope) {
    $scope.send = function () {
      var tx = app.net.remote.transaction();
      console.log($scope.amount);
      tx.payment(app.id.account, $scope.recipient, ""+$scope.amount);
      tx.set_flags('CreateAccount');
      tx.on('success', function () {});
      tx.on('error', function () {});
      tx.submit();
    };
  });
};

SendTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('form').submit(function (e) {
    e.preventDefault();
  });
};

module.exports = SendTab;
