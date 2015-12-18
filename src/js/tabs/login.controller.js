'use strict';

var util = require('util');
var Tab = require('../client/tab').Tab;

var LoginTab = function() {
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
  module.controller('LoginCtrl', ['$scope', '$location', '$sce', 'rpTracker', 'rpId', 'rpAPI',
    function($scope, $location, $sce, tracker, id, api) {

      $scope.error = '';
      $scope.loggingIn = false;
      $scope.redirectTo = $location.path();
      $scope.backendMessages = [];
      $scope.authAction = $sce.trustAsResourceUrl(Options.backend_url + '/auth/login');

      if (id.loginStatus) {
        $location.path('/balance');
        return;
      }

      $scope.migrate = function() {
        tracker.track('Migrate to Gatehub', {
          'Status': 'success'
        });
        window.location.assign('https://wallet.gatehub.net/#/identity/');
      };

      function loginCallback(err) {
        if (err) {
          $scope.loggingIn = false;
          $scope.status = '';

          $scope.status = 'Login failed:';

          if (err.name !== 'BlobError') {
            $scope.backendMessages.push(err.message);
          }

          if (!$scope.$$phase) {
            $scope.$apply();
          }

          return;
        }

        api.getUserProfile().success(function(profile) {

          store.set('profile_status', profile.ids_status);
          store.set('profile_country', profile.country);

          $scope.loggingIn = false;
          $scope.status = '';

          //store.set('profile_status', $location.search().status);

          if ($location.search().redirect_to) {
            $location.url($location.search().redirect_to);
          } else {
            $location.path('/balance').search('');
          }

          tracker.track('Login', {
            'Status': 'success'
          });
        });
      }

      $scope.submitForm = function(authAction) {
        $scope.redirectTo = encodeURIComponent($location.url());
        $scope.authAction = $sce.trustAsResourceUrl(Options.backend_url + '/auth/' + authAction);
      };

      // if ($routeParams.callback === 'callback' && $routeParams.token ) {
      if ($location.path() === '/login/callback' && $location.search().token) {
        $scope.loggingIn = true;
        id.login($location.search().token, loginCallback);
      }

    }]
  );
};

module.exports = LoginTab;
