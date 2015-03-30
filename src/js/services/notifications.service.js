/**
 * Notifications
 * Interaction with notifications REST API
 */

var module = angular.module('notifications', []);

module.factory('rpNotifications', ['$http', '$q', function($http, $q) {
  var rpNotifications = {};

  function appendTransform(defaults, transform) {
    // We can't guarantee that the default transformation is an array
    defaults = angular.isArray(defaults) ? defaults : [defaults];
    // Append the new transformation to the defaults
    return defaults.concat(transform);
  }

  rpNotifications.getSubscription = function(account, email) {
    return $http.get(
      Options.notifications_api_url + '/subscriptions',
      {
        params: {account: account, email: email},
        transformResponse: appendTransform($http.defaults.transformResponse, function (data) {
          if (data[0].notification_types) {
            return data[0];
          } else {
            return data;
          }
        })
      }
    );
  };

  rpNotifications.createUpdateSubscription = function(subscription) {
    return $http.post(Options.notifications_api_url + '/subscriptions', subscription);
  };

  return rpNotifications;
}]);
