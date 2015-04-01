var util = require('util');
var Tab = require('../client/tab').Tab;

var LoginTab = function ()
{
  Tab.call(this);
};

util.inherits(LoginTab, Tab);

LoginTab.prototype.tabName = 'login';
LoginTab.prototype.pageMode = 'single';
LoginTab.prototype.parent = 'main';

LoginTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/login.jade')();
};

LoginTab.prototype.angular = function (module) {
  module.controller('LoginCtrl', ['$scope', '$element', '$routeParams',
                                  '$location', 'rpId', '$rootScope',
                                  'rpPopup', '$timeout', 'rpTracker', 'rpAuthFlow',
                                  '$interval',
                                  function ($scope, $element, $routeParams,
                                            $location, id, $rootScope,
                                            popup, $timeout, rpTracker, authflow, $interval)
  {
    $scope.attempts = 0;
    $scope.error = '';
    $scope.password = '';
    $scope.token = '';
    $scope.showRecover = false;
    $scope.rememberMe = true;

    $scope.loginForm && $scope.loginForm.$setPristine(true);
    $scope.backendMessages = [];

    var updater;

    if (id.loginStatus) {
      $location.path('/balance');
      return;
    }

    $scope.goto_recover = function() {
      if($scope.username){
        $location.path('/recover/' + $scope.username);
      }
      else {
        $location.path('/recover');
      }
    };

    //set username and password here so
    //that the form will be valid if we are
    //only verifying via 2FA
    if ($scope.twoFactor && $scope.twoFactor.tokenError) {
      $scope.backendMessages.push($scope.twoFactor.tokenError.message);
    }

    // Autofill fix
    $timeout(function(){
      $scope.$apply(function () {
        $scope.username = $element.find('input[name="login_username"]').val();
        $scope.password = $element.find('input[name="login_password"]').val();
      });
    }, 1000);

    var updateFormFields = function(){
      var username;
      var password;

      // There are multiple login forms due to the Ripple URI login feature.
      // But only one of them should be visible and that's the one we want.
      username = $element.find('input[name="login_username"]:visible').eq(0).val();
      password = $element.find('input[name="login_password"]:visible').eq(0).val();

      if ("string" === typeof username) {
        $scope.loginForm.login_username.$setViewValue(username);
      }
      if ("string" === typeof password) {
        $scope.loginForm.login_password.$setViewValue(password);
      }
    };

    // Issues #1024, #1060
    $scope.$watch('username',function(){
      $rootScope.username = $scope.username;
      $timeout(function(){
        $scope.$apply(function () {
          updateFormFields();
        });
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

      //submitting a verification code
      if ($scope.twoFactor) {
        var options = {
          url         : $scope.twoFactor.blob_url,
          id          : $scope.twoFactor.blob_id,
          device_id   : $scope.twoFactor.device_id,
          token       : $scope.token,
          remember_me : $scope.rememberMe
        };

        id.verifyToken(options, function(err, resp) {
          $scope.ajax_loading = false;

          if (err) {
            $scope.status = 'Verification Falied:';
            $scope.backendMessages.push(err.message);

          } else {
            var username = (""+$scope.username).trim();
            var keys     = {
              id    : $scope.twoFactor.blob_id,
              crypt : $scope.twoFactor.blob_key
            };

            //save credentials for login
            id.storeLoginKeys($scope.twoFactor.blob_url, username, keys);
            id.setUsername(username);
            id.setDeviceID(username, $scope.twoFactor.device_id);
            setImmediate(login);
          }
        });

        $scope.ajax_loading = true;
        $scope.error  = '';
        $scope.status = 'verifiying...';
        return;
      }

      // Issue #36: Password managers may change the form values without
      // triggering the events Angular.js listens for. So we simply force
      // an update of Angular's model when the form is submitted.
      updateFormFields();

      setImmediate(login);

      $scope.ajax_loading = true;
      $scope.error  = '';
      $scope.status = 'Logging in...';
    };

    //initiate the login
    function login () {
      if ($scope.twoFactor) {
        id.relogin(loginCallback);

      } else {
        id.login({
          username   : $scope.username,
          password   : $scope.password
        }, loginCallback);
      }
    }
    $scope.$on('$idRemoteLogin', function(){
      id.relogin(loginCallback);
    });

    //handle the login results
    function loginCallback (err, blob) {

      $scope.ajax_loading = false;

      //blob has 2FA enabled
      if (err && err.twofactor) {
        if (err.twofactor.tokenError) {
          $scope.status = 'Request token:';
          $scope.backendMessages.push(err.twofactor.tokenError.message);
          return;
        }

        $scope.twoFactor     = err.twofactor;
        $scope.twoFactor.via = '';//TODO remove this from blob response
        $scope.status        = '';
        $scope.maskedPhone   = err.twofactor.masked_phone;

        //TODO: different display if 'ignored' is set,
        //meaning the user has the app
        if (err.twofactor.tokenResponse) {
          $scope.twoFactor.via = err.twofactor.tokenResponse.via;
        }

        return;

      //login failed for a different reason
      } else if (err) {
        if (++$scope.attempts>2) {
          $scope.showRecover = true;
        }

        $scope.status = 'Login failed:';

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
          $scope.backendMessages.push(err.message);
        }

        if (!$scope.$$phase) {
          $scope.$apply();
        }
        return;
      }

      rpTracker.track('Login', {
        'Status': 'success'
      });

      $scope.status = '';

      if ($.isEmptyObject($routeParams)) {
        $location.path('/balance');
      }
    }

    $scope.requestToken = function() {
      var force = $scope.twoFactor.via == 'app' ? true : false;
      $scope.status = 'requesting token...';
      authflow.requestToken($scope.twoFactor.blob_url, $scope.twoFactor.blob_id, force, function(tokenError, tokenResp) {
        if (tokenError) {
          $scope.status = 'token request failed...';
          $scope.backendMessages.push(tokenError.message);
        } else {
          $scope.status = 'token resent!';
        }
      });
    };

    $scope.cancel2FA = function() {
      $scope.twoFactor  = null;
      $scope.status     = null;
    };

    // needed for password managers that don't raise change event on input field
    updater = $interval(updateFormFields, 2000);

    $scope.$on('$destroy', function() {
      $interval.cancel(updater);
    });
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

module.exports = LoginTab;
