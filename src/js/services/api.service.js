'use strict';

/**
 * Backend API
 * Interaction with Ripple Trade Backend REST API
 */

var module = angular.module('api', []);

module.factory('rpAPI', ['$http', function($http) {
  var rpAPI = {};
  var httpOptions = {};

  rpAPI.setHttpOptions = function() {
    httpOptions = {
      headers: {'Authorization': 'Bearer ' + store.get('backend_token')},
      timeout: 8000
    };
  };

  rpAPI.setHttpOptions();

  rpAPI.getSubscription = function() {
    return $http.get(Options.backend_url + '/api/subscription', httpOptions);
  };

  rpAPI.updateSubscription = function(subscription) {
    return $http.put(Options.backend_url + '/api/subscription', subscription, httpOptions);
  };

  rpAPI.getUserProfile = function() {
    return $http.get(Options.backend_url + '/api/user', httpOptions);
  };

  rpAPI.getBlob = function() {
    return $http.get(Options.backend_url + '/api/blob', httpOptions);
  };

  rpAPI.updateBlob = function(blobData) {
    return $http.post(Options.backend_url + '/api/blob', blobData, httpOptions);
  };

  return rpAPI;
}]);
