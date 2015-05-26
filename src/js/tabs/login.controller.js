

var util = require('util');
var Tab = require('../client/tab').Tab;

var LoginTab = function()
{
  Tab.call(this);
};

util.inherits(LoginTab, Tab);

LoginTab.prototype.tabName = 'login';
LoginTab.prototype.pageMode = 'single';
LoginTab.prototype.parent = 'main';

LoginTab.prototype.extraRoutes = [
  {name: '/login/:callback'}
];

LoginTab.prototype.angular = function(module) {
  module.controller('LoginCtrl', ['$scope', '$location', '$sce', 'rpTracker', 'rpId',
    function($scope, $location, $sce, rpTracker, id) {

      $scope.error = '';
      $scope.redirectTo = $location.path();
      $scope.backendMessages = [];
      $scope.authAction = $sce.trustAsResourceUrl(Options.backend_url + '/auth/login');

      if (id.loginStatus) {
        $location.path('/balance');
        return;
      }

      function loginCallback(err) {
        if (err) {
          $scope.status = 'Login failed:';

          if (err.name !== 'BlobError') {
            $scope.backendMessages.push(err.message);
          }

          if (!$scope.$$phase) {
            $scope.$apply();
          }
          return;
        }

        if ($location.search().redirect_to) {
          $location.path($location.search().redirect_to).search('');
        } else {
          $location.path('/balance').search('');
        }

        rpTracker.track('Login', {
          'Status': 'success'
        });

        $scope.status = '';
      }

      $scope.submitForm = function(authAction) {
        $scope.redirectTo = $location.path();
        $scope.authAction = $sce.trustAsResourceUrl(Options.backend_url + '/auth/' + authAction);
      };

      // if ($routeParams.callback === 'callback' && $routeParams.token ) {
      if ($location.path() === '/login/callback' && $location.search().token) {
        id.login($location.search().token, loginCallback);
      }

    }]
  );
};

module.exports = LoginTab;
