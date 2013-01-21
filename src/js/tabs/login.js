var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var LoginTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
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
    $scope.backendChange = function()
    {
      app.id.blobBackends = $scope.blobBackendCollection.something.value.split(',');
      store.set('blobBackends', app.id.blobBackends);
    };

    $scope.error = '';
    self.on('beforeshow', handleShow);

    function handleShow()
    {
      $scope.username = '';
      $scope.password = '';
      $scope.loginForm.$setPristine(true);
      $scope.$digest();
    }

    $scope.submitForm = function()
    {
      $scope.backendMessages = [];

      app.id.login($scope.username, $scope.password, function(backendName, err, success) {
        $scope.ajax_loading = false;
        if (success) {
          tm.gotoTab('balance');
        } else {
          $scope.backendMessages.push({'backend':backendName, 'message':err.message});
        }

        if(!$scope.$$phase) {
          $scope.$digest();
        }
      });

      $scope.ajax_loading = true;
      $scope.error = '';
      $scope.status = 'Fetching wallet...';
    };
  })
};

LoginTab.prototype.onAfterRender = function ()
{
  setImmediate(function() {
    $("#login_username").focus();
  });
};

module.exports = LoginTab;
