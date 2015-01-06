var util = require('util');
var Tab = require('../client/tab').Tab;

var MigrateTab = function ()
{
  Tab.call(this);
};

util.inherits(MigrateTab, Tab);

MigrateTab.prototype.tabName = 'migrate';
MigrateTab.prototype.pageMode = 'single';
MigrateTab.prototype.parent = 'main';

MigrateTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/migrate.jade')();
};

MigrateTab.prototype.angular = function (module) {
  module.controller('MigrateCtrl', ['$scope', '$element', '$routeParams',
                                  '$location', 'rpId', '$rootScope',
                                  'rpPopup', '$timeout', 'rpTracker', 'rpAuthFlow',
                                  function ($scope, $element, $routeParams,
                                            $location, id, $rootScope,
                                            popup, $timeout, rpTracker, authflow)
  {
    
    $scope.attempts = 0;
    $scope.error = '';
    $scope.password = '';
    $scope.backendMessages = [];
    
    if (id.loginStatus) {
      $location.path('/balance');
      return;
    }

    $scope.submitForm = function()
    {
      if ($scope.ajax_loading) return;

      $scope.backendMessages = [];

      login();

      $scope.ajax_loading = true;
      $scope.error = '';
      $scope.status = 'Logging in...';
    };

    //initiate the login
    function login () {
      id.oldLogin({
        username: $scope.username,
        password: $scope.password
      }, loginCallback);
    }

    //handle the login results
    function loginCallback (err, blob) {

      $scope.ajax_loading = false;

      if (err) {
        // TODO move to template
        $scope.status = "Migrate failed:";
        $scope.error = "This username/passphrase combination doesn't exist in ripple.com/client. Please try again.";

        if (err.name === "OldBlobError") {
          popup.confirm("Wallet Upgrade", "Ripple is upgrading the wallet encryption format. After the upgrade, only Ripple clients 0.2.24 or higher can access your wallet.<br><br>If you use other clients, please make sure they are upgraded to the current version.",
                        "OK", "migrateConfirm()", null,
                        "Abort login", null, null,
                        $scope, {});

          $scope.migrateConfirm = function () {
            id.allowOldBlob = true;
            $scope.submitForm();
          };
        }

        if (err.name !== "BlobError") {
          $scope.backendMessages.push({'backend': "ID", 'message': err.message});
        }

        if (!$scope.$$phase) {
          $scope.$apply();
        }
        return;
      }

      $scope.error = '';
      $scope.status = '';
      if ($routeParams.tab) {
        $location.path('/'+$routeParams.tab);
      } else {
        if ($rootScope.verifyStatus) {
          $rootScope.verifyStatus = '';
          $location.path('/fund');
        }
        else {
          $location.path('/balance');
        }
      }
    }

  }]);

  /**
   * Focus on username input only if it's empty. Otherwise focus on password field
   * This directive will not be used anywhere else, that's why it's here.
   */
  module.directive('rpFocusOnEmpty', ['$timeout', function($timeout) {
    return function($scope, element) {
      $timeout(function(){
        $scope.$watch(function () {return element.is(':visible');}, function(newValue) {
          if (newValue === true && !element.val())
            element.focus();
        });
      }, 200);
    };
  }]);
};

module.exports = MigrateTab;
