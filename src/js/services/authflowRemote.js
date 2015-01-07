/**
 * AUTH FLOW
 *
 * The auth flow service manages the login, unlock and registration procedures.
 */

var webutil     = require("../util/web");
var log         = require("../util/log");

angular
  .module('authflow', [])
  .factory('rpAuthFlow', ['$rootScope',
                              function ($scope)
{
  var AuthFlow = {};

  AuthFlow.exists = function (username, password, callback) {
    var meta = AuthFlow.getVaultClient(username);
    meta.client.exists(meta.username, callback);
  };

  AuthFlow.login = function (opts, callback) {
    var meta     = AuthFlow.getVaultClient(opts.username);
    var deviceID = opts.device_id || meta.client.generateDeviceID();
    meta.client.login(meta.username, opts.password, deviceID, function(err, resp) {
      if (err) {
        $scope.$apply(function(){
          callback(err);
        });

        return;
      }

      var keys = {
        id    : resp.blob.id,
        crypt : resp.blob.key
      };

      console.log("client: authflow: login succeeded", resp.blob);
      $scope.$apply(function(){
        callback(null, resp.blob, keys, resp.username, resp.verified);
      });
    });
  };

  /**
   * Register an account
   *
   * @param {object} opts
   * @param {string} opts.username
   * @param {string} opts.password
   * @param {string} opts.account
   * @param {string} opts.masterkey
   * @param {object} opts.oldUserBlob
   * @param {function} callback
   */
  AuthFlow.register = function (opts, callback) {
    opts.activateLink = Options.activate_link; //add the email activation link
    opts.domain = Options.domain;

    var meta = AuthFlow.getVaultClient(opts.username);
    opts.username = meta.username;

    meta.client.register(opts, function(err, resp) {
      if (err) {
        $scope.$apply(function(){
          callback(err);
        });
        return;
      }

      var keys = {
        id    : resp.blob.id,
        crypt : resp.blob.key
      };

      console.log("client: authflow: registration succeeded", resp.blob);
      $scope.$apply(function(){
        callback(null, resp.blob, keys, resp.username);
      });
    });
  };

  AuthFlow.verify = function (opts, callback) {
    var meta = AuthFlow.getVaultClient(opts.username);
    meta.client.verify(meta.username, opts.token, function(err, resp){
      $scope.$apply(function(){
        callback(err, resp);
      });
    });
  };

  AuthFlow.resendEmail = function (opts, callback) {
    opts.activateLink = Options.activate_link;
    var meta = AuthFlow.getVaultClient(opts.username);
    opts.username = meta.username;
    meta.client.resendEmail(opts, function(err, resp){
      $scope.$apply(function(){
        callback(err, resp);
      });
    });
  };

  AuthFlow.rename = function (opts, callback) {
    var meta = AuthFlow.getVaultClient(opts.username);
    meta.client.rename(opts, function(err, resp){
      $scope.$apply(function(){
        callback(err, resp);
      });
    });
  };

  AuthFlow.relogin = function (url, keys, deviceID, callback) {
    var meta = AuthFlow.getVaultClient('');
    if (!deviceID) deviceID = meta.client.generateDeviceID();
    meta.client.relogin(url, keys.id, keys.crypt, deviceID, function(err, resp){
        if (err) {
          callback(err);
          return;
        }

       callback(null, resp.blob);
    });
  };

  AuthFlow.unlock = function (username, password, callback) {
    if (!$scope.userBlob) {
      $scope.$apply(function(){
        callback(new Error("Blob not found"));
      });
      return;
    }

    var meta = AuthFlow.getVaultClient(username);
    var encrypted_secret = $scope.userBlob.encrypted_secret;
    meta.client.unlock(meta.username, password, encrypted_secret, function (err, resp){
      setImmediate(function(){
        $scope.$apply(function(){
          callback(err, resp);
        });
      });
    });
  };

  AuthFlow.recoverBlob = function (username, masterkey, callback) {
    var meta = AuthFlow.getVaultClient(username);

    meta.client.getAuthInfo(username, function(err, authInfo){
      if (err) {
        $scope.$apply(function(){
          callback(err);
        });

      } else if (!authInfo.exists) {
        $scope.$apply(function(){
          callback(new Error ("User does not exist."));
        });

      } else {
        var options = {
          url       : authInfo.blobvault,
          username  : authInfo.username, //must use actual username
          masterkey : masterkey
        };
        meta.client.recoverBlob(options, function (err, resp) {
          setImmediate(function() {
            $scope.$apply(function() {

              //need the actual username for the change password call
              if (resp) {
                resp.username = authInfo.username;
              }

              callback(err, resp);
            });
          });
        });
      }

    });
  };

  AuthFlow.changePassword = function (options, callback) {
    var meta = AuthFlow.getVaultClient(options.username);

    meta.client.changePassword(options, function(err, resp){
      $scope.$apply(function(){
        callback(err, resp);
      });
    });
  };

  AuthFlow.requestToken = function (url, id, force_sms, callback) {
    var meta = AuthFlow.getVaultClient('');
    meta.client.requestToken(url, id, force_sms, function(err, resp){
      $scope.$apply(function() {
        callback(err, resp);
      });
    });
  };

  AuthFlow.verifyToken = function (options, callback) {
    var meta = AuthFlow.getVaultClient('');
    if (!options.device_id) {
      options.device_id = meta.client.generateDeviceID();
    }

    meta.client.verifyToken(options, function(err, resp){
      $scope.$apply(function() {
        callback(err, resp);
      });
    });
  };

  AuthFlow.deleteBlob = function (options, callback) {
    var meta = AuthFlow.getVaultClient('');

    meta.client.deleteBlob(options, function(err, resp) {
      $scope.$apply(function() {
        callback(err, resp);
      });
    });
  };

  AuthFlow.updateAttestation = function (options, callback) {
    var meta = AuthFlow.getVaultClient('');

    meta.client.updateAttestation(options, function(err, resp) {
      $scope.$apply(function() {
        callback(err, resp);
      });
    });
  };

  AuthFlow.getAttestation = function(options, callback) {
    var meta = AuthFlow.getVaultClient('');

    meta.client.getAttestation(options, function(err, resp) {
      $scope.$apply(function() {
        callback(err, resp);
      });
    });
  };

  AuthFlow.getAttestationSummary = function(options, callback) {
    var meta = AuthFlow.getVaultClient('');

    meta.client.getAttestationSummary(options, function(err, resp) {
      $scope.$apply(function() {
        callback(err, resp);
      });
    });
  };

  AuthFlow.getVaultClient = function(username) {
    var meta = { username: username, domain: Options.domain };

    var atSign = username.indexOf('@');
    if (atSign !== -1) {
      meta = {
        username: username.substring(0, atSign),
        domain: username.substring(atSign+1)
      };
    }

    meta.client = new rippleVaultClient.VaultClient(meta.domain);

    return meta;
  };

  return AuthFlow;
}]);
