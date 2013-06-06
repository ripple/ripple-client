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
                                  'rpPopup',
                                  function ($scope, $element, $routeParams,
                                            $location, $id, $rootScope,
                                            popup)
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
    $scope.backendMessages = [];

    $rootScope.$on("$blobError", function (e, err) {
      console.log("BLOB ERROR", arguments);
      $scope.backendMessages.push({'backend': err.backend, 'message': err.message});
    });

    $scope.submitForm = function()
    {
      if ($scope.ajax_loading) return;

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
        $id.login($scope.username, $scope.password, function (err, blob) {
          $scope.ajax_loading = false;

          if (err) {
            $scope.status = 'Login failed:';

            if (err.name === "OldBlobError") {
              popup.confirm("Wallet Upgrade", "Ripple is upgrading the wallet encryption format. After the upgrade, only Ripple clients 0.2.24 or higher can access your wallet.<br><br>If you use other clients, please make sure they are upgraded to the current version.",
                            "OK", "migrateConfirm()", null,
                            "Abort login", null, null,
                            $scope, {});

              $scope.migrateConfirm = function () {
                $id.allowOldBlob = true;
                $scope.submitForm();
              };
            }

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
