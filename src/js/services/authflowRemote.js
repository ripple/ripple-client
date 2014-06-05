/**
 * AUTH FLOW
 *
 * The auth flow service manages the login, unlock and registration procedures.
 */

var vaultClient = new ripple.VaultClient(Options.domain);
var webutil     = require("../util/web");
var log         = require("../util/log");

var module = angular.module('authflow', ['authinfo', 'kdf']);

module.factory('rpAuthFlow', ['$rootScope', 'rpAuthInfo', 'rpKdf', 'rpBlob',
                              function ($scope, $authinfo, $kdf, $blob)
{
  var AuthFlow = {};

  AuthFlow.exists = function (username, password, callback) {
    vaultClient.exists(username, callback); 
  };

  AuthFlow.login = function (opts, callback) {
    vaultClient.login(opts.username, opts.password, function(err, resp) {
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
    
    vaultClient.register(opts, function(err, resp) {
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
    vaultClient.verify(opts.username, opts.token, function(err, resp){
      $scope.$apply(function(){
        callback(err, resp);      
      });     
    });
  };

  AuthFlow.resendEmail = function (opts, callback) {
    opts.activateLink = Options.activate_link;
    vaultClient.resendEmail(opts, function(err, resp){
      $scope.$apply(function(){
        callback(err, resp);
      });  
    });
  };

  AuthFlow.relogin = function (url, keys, callback) {
    vaultClient.relogin(url, keys.id, keys.crypt, function(err, resp){
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
    
    var encrypted_secret = $scope.userBlob.encrypted_secret;
    vaultClient.unlock(username, password, encrypted_secret, function (err, resp){
      setImmediate(function(){
        $scope.$apply(function(){ 
          callback(err, resp);         
        });     
      });    
    });        
  };

  return AuthFlow;
}]);
