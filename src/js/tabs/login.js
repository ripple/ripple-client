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
                                  'rpPopup', '$timeout',
                                  function ($scope, $element, $routeParams,
                                            $location, $id, $rootScope,
                                            popup, $timeout)
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

    // Autofill fix
    $timeout(function(){
      $scope.$apply(function () {
        $scope.username = $element.find('input[name="login_username"]').val();
        $scope.password = $element.find('input[name="login_password"]').val();
      })
    }, 1000);

    $rootScope.$on("$blobError", function (e, err) {
      console.log("BLOB ERROR", arguments);
      $scope.backendMessages.push({'backend': err.backend, 'message': err.message});
    });

    var updateFormFields = function(){
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
    };

    // Issues #1024, #1060
    $scope.$watch('username',function(){
      $timeout(function(){
        $scope.$apply(function () {
         updateFormFields();
        })
      }, 50);
    });

    // Ok, now try to remove this line and then go write "a" for wallet name, and "a" for passphrase.
    // "Open wallet" is still disabled hah? no worries, just enter anything else and it will be activated.
    // Probably this is an AngularJS issue. Had no time to check it yet.
    $scope.$watch('password');

    $scope.submitForm = function()
    {
      if ($scope.ajax_loading) return;

      $scope.backendMessages = [];

      // Issue #36: Password managers may change the form values without
      // triggering the events Angular.js listens for. So we simply force
      // an update of Angular's model when the form is submitted.
      updateFormFields();

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

  /**
   * Focus on username input only if it's empty. Otherwise focus on password field
   * This directive will not be used anywhere else, that's why it's here.
   */
  module.directive('rpFocusOnEmpty', ['$timeout', function($timeout) {
    return function($scope, element) {
      $timeout(function(){
        $scope.$watch(function () {return element.is(':visible')}, function(newValue) {
          if (newValue === true && !element.val())
            element.focus();
        })
      }, 200)
    }
  }]);
};



module.exports = LoginTab;
