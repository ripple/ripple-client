var util = require('util');
var Tab = require('../client/tab').Tab;

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
  module.controller('LoginCtrl', ['$scope', '$element', '$routeParams',
                                  '$location', 'rpId', '$rootScope',
                                  function ($scope, $element, $routeParams,
                                            $location, $id, $rootScope)
  {
    if ($id.loginStatus) {
      $location.path('/balance');
      return;
    }

    $scope.backendChange = function()
    {
      $id.blobBackends = $scope.blobBackendCollection.something.value.split(',');
      store.set('ripple_blobBackends', $id.blobBackends);
    };

    $scope.error = '';
    $scope.username = '';
    $scope.password = '';
    $scope.loginForm && $scope.loginForm.$setPristine(true);

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

      $rootScope.$on("$blobError", function (e, err) {
        console.log("BLOB ERROR", arguments);
        $scope.backendMessages.push({'backend': err.backend, 'message': err.message});
      });

      setImmediate(function () {
        $id.login($scope.username, $scope.password, function (err) {
          $scope.ajax_loading = false;

          if (err) {
            $scope.status = 'Login failed:';

            if (err.name !== "BlobError") {
              $scope.backendMessages.push({'backend': "ID", 'message': err.message});
            }
            return;
          }

          $scope.status = '';
          if ($routeParams.tab) {
            $location.path('/'+$routeParams.tab);
          } else {
            $location.path('/balance');
          }
        });
      });

      $scope.ajax_loading = true;
      $scope.error = '';
      $scope.status = 'Fetching wallet...';
    };
  }]);
};

module.exports = LoginTab;
