'use strict';

/**
 * AUTH FLOW IDS
 *
 * The auth flow service manages the login, unlock and registration procedures.
 */

var module = angular.module('authflowids', []);

module.factory('rpAuthFlowIDS', ['$rootScope', function($scope) {
  var AuthFlow = {};

  AuthFlow.exists = function(username, callback) {
    var meta = AuthFlow.getVaultClient(username);
    meta.client.exists(meta.username, callback);
  };

  AuthFlow.unlock = function(username, password, callback) {
    if (!$scope.userBlob) {
      $scope.$apply(function() {
        callback(new Error('Blob not found'));
      });
      return;
    }

    var meta = AuthFlow.getVaultClient(username);
    var encrypted_secret = $scope.userBlob.encrypted_secret;
    meta.client.unlock(meta.username, password, encrypted_secret, function(err, resp) {
      setImmediate(function() {
        $scope.$apply(function() {
          callback(err, resp);
        });
      });
    });
  };

  AuthFlow.getVaultClient = function(username) {
    var meta = {username: username, domain: Options.domain};

    var atSign = username.indexOf('@');
    if (atSign !== -1) {
      meta = {
        username: username.substring(0, atSign),
        domain: username.substring(atSign + 1)
      };
    }

    meta.client = new rippleVaultClient.VaultClient(meta.domain);

    return meta;
  };

  return AuthFlow;
}]);
