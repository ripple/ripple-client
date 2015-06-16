'use strict';

/**
 * Notifications
 * Interaction with notifications REST API
 */

var module = angular.module('notifications', []);

module.factory('rpNotifications', ['$http', function($http) {
  var rpNotifications = {};

  rpNotifications.getSubscription = function() {
    return $http.get(
      Options.backend_url + '/api/subscription',
      {
        headers: {'Authorization': 'Bearer ' + store.get('backend_token')}
      });
  };

  rpNotifications.updateSubscription = function(subscription) {
    return $http.put(
      Options.backend_url + '/api/subscription',
      subscription,
      {
        headers: {Authorization: 'Bearer ' + store.get('backend_token')}
      }
    );
  };

  return rpNotifications;
}]);
