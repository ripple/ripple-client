var util = require('util');
var Tab = require('../client/tab').Tab;

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
  var app = this.app;

  module.controller('LoginCtrl', ['$scope', '$element', '$routeParams',
                                  '$location', 'rpId',
                                  function ($scope, $element, $routeParams,
                                            $location, $id)
  {
    if ($id.loginStatus) {
      $location.path('/balance');
      return;
    }

    $scope.backendChange = function()
    {
      app.id.blobBackends = $scope.blobBackendCollection.something.value.split(',');
      store.set('ripple_blobBackends', app.id.blobBackends);
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

      // Issue #36: Password managers may change the form values without
      // triggering the events Angular.js listens for. So we simply force
      // an update of Angular's model when the form is submitted.
      var username;
      var password;

      $.each($element.find('input[name="login_username"]'), function(index,field){
        if ($(field).val()) {
          username = $(field).val();
        }
      });

      $.each($element.find('input[name="login_password"]'), function(index,field){
        if ($(field).val()) {
          password = $(field).val();
        }
      });

      $scope.loginForm.login_username.$setViewValue(username);
      $scope.loginForm.login_password.$setViewValue(password);

      setImmediate(function () {
        app.id.login($scope.username, $scope.password, function(backendName, err, success) {
          $scope.ajax_loading = false;
          if (success) {
            if ($routeParams.tab) {
              $location.path('/'+$routeParams.tab);
            } else {
              $location.path('/balance');
            }
          } else {
            $scope.backendMessages.push({'backend':backendName, 'message':err.message});
          }

          $scope.$digest();
        });
      });

      $scope.ajax_loading = true;
      $scope.error = '';
      $scope.status = 'Fetching wallet...';
    };
  }]);
};

LoginTab.prototype.onAfterRender = function ()
{
  setImmediate(function() {
    $("#login_username").focus();
  });
};

module.exports = LoginTab;
