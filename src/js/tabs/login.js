var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var LoginTab = function ()
{
  Tab.call(this);
};

util.inherits(LoginTab, Tab);

LoginTab.prototype.pageMode = 'single';
LoginTab.prototype.parent = 'main';

LoginTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/login.jade')();
};

LoginTab.prototype.angular = function (module) {
  var self = this;
  var tm = this.tm;
  var app = this.app;

  module.controller('LoginCtrl', function ($scope)
  {
    // TODO login with wallet
    $scope.error = '';
    self.on('beforeshow', handleShow);

    function handleShow()
    {
      $scope.username = '';
      $scope.password = '';
      $scope.loginForm.$setPristine(true);
      $scope.$digest();

      self.el.find('#login_username').focus();
    }

    $scope.submitForm = function()
    {
      app.id.login($scope.username, $scope.password, function(err, success) {
        // XXX: Handle err
        if (success) {
          console.log('success');
          tm.gotoTab('overview');
        } else {
          $scope.error = 'Username and/or password is wrong';
          $scope.$digest();
        }
      });
    }
  })
};

module.exports = LoginTab;
