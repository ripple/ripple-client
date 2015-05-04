

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
  module.controller('LoginCtrl', ['$scope', '$routeParams', '$location', 'rpTracker', 'rpId',
    function($scope, $routeParams, $location, rpTracker, id) {

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

        $location.path('/balance').search('');

        /*
         if ($.isEmptyObject($routeParams)) {
         $location.path('/balance');
         }
         */

        rpTracker.track('Login', {
          'Status': 'success'
        });

        $scope.status = '';
      }

      $scope.error = '';
      $scope.rememberMe = true;
      $scope.backendMessages = [];

      if (id.loginStatus) {
        $location.path('/balance');
        return;
      }

      // if ($routeParams.callback === 'callback' && $routeParams.token ) {
      if ($location.path() === '/login/callback' && $location.search().token) {
        id.login($routeParams.token, loginCallback);
      }

    }]
  );
};

module.exports = LoginTab;
