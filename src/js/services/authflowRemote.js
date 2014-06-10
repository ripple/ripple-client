/**
 * AUTH FLOW
 *
 * The auth flow service manages the login, unlock and registration procedures.
 */

var webutil     = require("../util/web");
var log         = require("../util/log");

var module = angular.module('authflow', ['authinfo', 'kdf']);

module.factory('rpAuthFlow', ['$rootScope', 'rpAuthInfo', 'rpKdf', 'rpBlob',
                              function ($scope, $authinfo, $kdf, $blob)
{
  var AuthFlow = {};

  AuthFlow.exists = function (username, password, callback) {
    var meta = AuthFlow.getVaultClient(username);
    meta.client.exists(meta.username, callback);
  };

  AuthFlow.login = function (opts, callback) {
    var meta = AuthFlow.getVaultClient(opts.username);
    meta.client.login(meta.username, opts.password, function(err, resp) {
      if (err) {
        return callback(err);
      }

      var keys = {
        id    : resp.blob.id,
        crypt : resp.blob.key
      }
              
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
      }
              
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

  AuthFlow.relogin = function (url, keys, callback) {
    var meta = AuthFlow.getVaultClient('');
    meta.client.relogin(url, keys.id, keys.crypt, function(err, resp){
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

  AuthFlow.getVaultClient = function(username) {
    var meta = { username: username, domain: Options.domain };

    var atSign = username.indexOf('@');
    if (atSign !== -1) {
      meta = {
        username: username.substring(0, atSign),
        domain: username.substring(atSign+1)
      };
    }

    meta.client = new ripple.VaultClient(meta.domain);

    return meta;
  }

  return AuthFlow;
}]);
