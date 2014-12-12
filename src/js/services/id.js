/**
 * ID
 *
 * The id service is used for user identification and authorization.
 */

var util = require('util'),
    webutil = require('../util/web'),
    Base58Utils = require('../util/base58'),
    RippleAddress = require('../util/types').RippleAddress;

var module = angular.module('id', ['authflow', 'blob', 'oldblob']);

module.factory('rpId', ['$rootScope', '$location', '$route', '$routeParams', '$timeout',
                        'rpAuthFlow', 'rpBlob', 'rpOldBlob', '$q', '$http',
                        function($scope, $location, $route, $routeParams, $timeout,
                                 $authflow, $blob, $oldblob, $q, $http)
{
  /**
   * Identity manager
   *
   * This class manages the encrypted blob and all user-specific state.
   */
  var Id = function ()
  {
    this.account = null;
    this.loginStatus = false;
    // name resolution cache
    this.resolvedNames = [],
    this.serviceInvoked = [];
  };

  // This object defines the minimum structure of the blob.
  //
  // This is used to ensure that the blob we get from the server has at least
  // these fields and that they are of the right types.
  Id.minimumBlob = {
    data: {
      contacts: [],
      preferred_issuer: {},
      preferred_second_issuer: {}
    },
    meta: []
  };

  // The default blob is the blob that a new user gets.
  //
  // Right now this is equal to the minimum blob, but we may define certain
  // default values here in the future.
  Id.defaultBlob = Id.minimumBlob;

  /**
   * Reduce username to standardized form.
   *
   * This creates the version of the username that is displayed in the UI.
   */
  Id.normalizeUsernameForDisplay = function (username) {
    username = ""+username;

    // Strips whitespace at beginning and end.
    username = username.trim();

    return username;
  };

  /**
   * Reduce username to standardized form.
   *
   * This version is used in the login system and it's the version sent to
   * servers.
   */
  Id.normalizeUsernameForInternals = function (username) {
    username = ""+username;

    // Strips whitespace at beginning and end.
    username = username.trim();

    // Remove hyphens
    username = username.replace(/-/g, '');

    // All lowercase
    username = username.toLowerCase();

    return username;
  };

  /**
   * Reduce username to the oldBlob standardized form.
   *
   * This version is used in the login system and it's the version sent to
   * servers.
   */
  Id.normalizeUsernameForOldBlob = function (username) {
    // The old blob does not remove hyphens

    username = ""+username;

    // Strips whitespace at beginning and end.
    username = username.trim();

    // All lowercase
    username = username.toLowerCase();

    return username;
  };

  /**
   * Reduce password to standardized form.
   *
   * Strips whitespace at beginning and end.
   */
  Id.normalizePassword = function (password) {
    password = ""+password;
    password = password.trim();
    return password;
  };

  Id.prototype.init = function ()
  {
    var self = this;

    // Initializing sjcl.random doesn't really belong here, but there is no other
    // good place for it yet.
    for (var i = 0; i < 8; i++) {
      sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
    }

    $scope.userBlob = Id.defaultBlob;
    $scope.userCredentials = {};

    $scope.$watch('userBlob',function(){
      // XXX Maybe the blob service should handle this stuff?
      $scope.$broadcast('$blobUpdate');

      // XXX What's the equivalent in the new login API?
      /*
      if (self.username && self.password) {
        $oldblob.set(...,
                  self.username.toLowerCase(), self.password,
                  $scope.userBlob,function(){
                    $scope.$broadcast('$blobSave');
                  });
      }
      */
    },true);

    $scope.$on('$blobUpdate', function(){
      // Account address
      if (!$scope.address && $scope.userBlob.data.account_id) {
        $scope.address = $scope.userBlob.data.account_id;
      }
    });

    if (!!store.get('ripple_auth')) {
      
      self.relogin(function(err, blob) {
        if (!blob) {
          self.logout();  
          $location.path('/login');
        }
      });
    }

    $(window).bind('storage', function (e) {
      // http://stackoverflow.com/questions/18476564/ie-localstorage-event-misfired
      if (document.hasFocus()) return;

      if (e.originalEvent.key == 'ripple_auth' && e.originalEvent.oldValue && !e.originalEvent.newValue) {
        $timeout(function(){ $scope.$broadcast('$idRemoteLogout'); }, 0);
      }

      if (e.originalEvent.key == 'ripple_auth' && !e.originalEvent.oldValue && e.originalEvent.newValue) {
        $timeout(function(){ $scope.$broadcast('$idRemoteLogin'); }, 0);
      }
    });
  };

  Id.prototype.setUsername = function (username)
  {
    this.username = username;
    $scope.userCredentials.username = username;
    $scope.$broadcast('$idUserChange', {username: username});
  };

  Id.prototype.setAccount = function (accId)
  {
    if (this.account !== null) {
      $scope.$broadcast('$idAccountUnload', {account: accId});
    }
    this.account = accId;
    $scope.userCredentials.account = accId;
    $scope.$broadcast('$idAccountLoad', {account: accId});
  };

  Id.prototype.setLoginKeys = function (keys)
  {
    this.keys = keys;
  };

  Id.prototype.isReturning = function ()
  {
    return !!store.get('ripple_known');
  };

  Id.prototype.isLoggedIn = function ()
  {
    return this.loginStatus;
  };

  Id.prototype.storeLoginKeys = function (url, username, keys)
  {
    store.set('ripple_auth', {url:url, username: username, keys: keys});
  };

  Id.prototype.verify = function (opts, callback) {
    $authflow.verify(opts, callback);
  };

  Id.prototype.resendEmail = function (opts, callback) {
    $authflow.resendEmail(opts, callback);
  };

  Id.prototype.rename = function (opts, callback) {
    opts.blob = $scope.userBlob;
    opts.url = $scope.userBlob.url;
    opts.username = this.username;

    $authflow.rename(opts, callback);
  };

  Id.prototype.register = function (opts, callback)
  {
    var self = this;

    // If account master key is not present, generate one
    var masterkey = !!opts.masterkey
      ? opts.masterkey
      : Base58Utils.encode_base_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)));

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    // Username is empty for the desktop client
    if (!opts.username) opts.username = 'local';

    // Blob data
    var username = Id.normalizeUsernameForDisplay(opts.username);
    var password = Id.normalizePassword(opts.password);
    var account  = (new RippleAddress(masterkey)).getAddress();

    $authflow.register({
      'username': username,
      'password': password,
      'account': account,
      'email': opts.email,
      'masterkey': masterkey,
      'oldUserBlob': opts.oldUserBlob,
      'walletfile': opts.walletfile
    },
    function (err, blob, keys) {
      if (err) {
        console.log("client: id: registration failed:", (err && err.stack) ? err.stack : err);
        callback(err);
        return;
      }

      $scope.userBlob = blob;

      self.setUsername(username);

//      self.setAccount(blob.data.account_id);
//      self.setLoginKeys(keys);
//      self.storeLoginKeys(username, keys);
//      self.loginStatus = true;
//      $scope.$broadcast('$blobUpdate');
      
      // Remove old blob
      if(Options.blobvault) {
        $oldblob.remove(['vault', 'local'], opts.oldUsername, opts.oldPassword, function (err, data) {
          if (err) {
            console.log("Can't delete the old blobvault:", err);
            return;
          }

          console.log('Old blob has been removed.');
        });
      }

      store.set('ripple_known', true);
      callback(null, masterkey);
    });
  };

  Id.prototype.exists = function (username, password, callback)
  {
    var self = this;

    username = Id.normalizeUsernameForDisplay(username);
    password = Id.normalizePassword(password);

    $authflow.exists(Id.normalizeUsernameForInternals(username), password, function (err, data) {
      if (!err && data) {
        // Blob found, new auth method
        callback(null, true);
      } else {
        // No blob found
        callback(null, false);
      }
    });
  };

  Id.prototype.oldLogin = function (opts, callback) {
    var self = this;

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    var username = Id.normalizeUsernameForDisplay(opts.username);
    var password = Id.normalizePassword(opts.password);
    var oldBlobUsername = Id.normalizeUsernameForOldBlob(username);

    $oldblob.get(['vault'], oldBlobUsername, password, function (oerr, data) {
//      $location.path('/register');

      if (oerr) {
        // Old blob failed - since this was just the fallback report the
        // original error
        console.log("Old backend reported:", oerr);
        callback(oerr);
        return;
      }

      var blob = $oldblob.decrypt(oldBlobUsername, password, data);
      if (!blob) {
        // Unable to decrypt blob
        var msg = 'Unable to decrypt blob (Username / Password is wrong)';
        callback(new Error(msg));
      } else if (blob.old && !self.allowOldBlob) {
        var oldBlobErr = new Error('Old blob format detected');
        oldBlobErr.name = "OldBlobError";
        callback(oldBlobErr);
      } else {
        // Migration

        $scope.oldUserBlob = blob;
        $scope.oldUsername = oldBlobUsername;
        $scope.oldPassword = password;
        $location.path('/register');

        return;
      }
    });
  };

  Id.prototype.login = function (opts, callback)
  {
    var self = this;

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    var username = Id.normalizeUsernameForDisplay(opts.username);
    var password = Id.normalizePassword(opts.password);
    var deviceID = opts.device_id || store.get('device_id');

    $authflow.login({
      'username': Id.normalizeUsernameForInternals(username),
      'password': password,
      'walletfile': opts.walletfile,
      'device_id' : deviceID
    }, function (err, blob, keys, actualUsername, emailVerified) {
      
      //handle 2FA
      if (err && err.twofactor) {
 
        //request verification token. If they are using the
        //app, the request will be ignored.
        $authflow.requestToken(err.twofactor.blob_url, err.twofactor.blob_id, false, function(tokenError, tokenResp) {
          
          //keep this for reporting
          err.twofactor.tokenError    = tokenError; 
          err.twofactor.tokenResponse = tokenResp;
          return callback(err);
        });
        
      } else if (err) {
        // New login protocol failed and no fallback configured
        callback(err);
      } else {
        // Ensure certain properties exist
        $.extend(true, blob, Id.minimumBlob);

        // Ripple's username system persists the capitalization of the username,
        // even though usernames are case-insensitive. That's why we want to use
        // the "actualUsername" that the server returned.
        //
        // However, we want this to never be a source for problems, so we'll
        // ensure the actualUsername returned is equivalent to what we expected
        // and fall back to what the user entered otherwise.
        if ("string" !== typeof actualUsername ||
            Id.normalizeUsernameForInternals(actualUsername) !== Id.normalizeUsernameForInternals(username)) {
          actualUsername = username;
        }

        $scope.userBlob = blob;
        self.setUsername(actualUsername);

        if (!emailVerified) {
          $scope.unverified = true;
          $location.path('/register');

          callback(new Error("Email has not been verified!"));
          return;
        }

        self.setAccount(blob.data.account_id);
        self.setLoginKeys(keys);
        self.storeLoginKeys(blob.url, actualUsername, keys);
        store.set('device_id', blob.device_id);
        self.loginStatus = true;
        $scope.loginStatus = true;
        $scope.$broadcast('$blobUpdate');
        store.set('ripple_known', true);

        if (blob.data.account_id) {
          // Success
          callback(null);
        } else {
          // Invalid blob
          callback(new Error("Blob format unrecognized!"));
        }
      }
    });
  };
  
  Id.prototype.relogin = function (callback) {
    var self     = this;
    var auth     = store.get('ripple_auth');
    var deviceID = store.get('device_id');
    if (!auth || !auth.keys) {
      return callback(new Error('Missing authentication keys'));
    }
    
    // XXX This is technically not correct, since we don't know yet whether
    //     the login will succeed. But we need to set it now, because the page
    //     controller will likely query it long before we get a response from
    //     the login system.
    //
    //     Will work fine as long as any relogin error triggers a logout and
    //     logouts trigger a full page reload.
    self.loginStatus = true;
    $scope.loginStatus = true;
    
    $authflow.relogin(auth.url, auth.keys, deviceID, function (err, blob) {
      
      if (err) {
        
        // Failed to relogin
        console.log("client: id: failed to relogin:", err.message || err.toString());
        callback(err);        
        
      } else {
        // Ensure certain properties exist
        $.extend(true, blob, Id.minimumBlob);

        $scope.userBlob = blob;
        self.setUsername(auth.username);
        self.setAccount(blob.data.account_id);
        self.setLoginKeys(auth.keys);
        self.loginStatus = true;
        $scope.loginStatus = true;
        $scope.$broadcast('$blobUpdate');
        store.set('ripple_known', true);
        callback(null, blob);
      }
    });    
  };

  Id.prototype.verifyToken = function (options, callback) {
    store.set('remember_me', options.remember_me);
    $authflow.verifyToken(options, callback);    
  }; 
  
  Id.prototype.changePassword = function (options, callback) {
    var self = this;
    
    $authflow.changePassword(options, function(err, resp) {  
      
      if (err) {
        return callback(err);
      }
      
      //NOTE: the section below changed so that you can recover with 2FA enabled
      //We should be checking attestation statuses here also.
      
      //perform login, so that the email verification is checked
      //and the username, blob, and keys get stored.
      //self.login(options, callback); 
      
      var keys = {id:options.blob.id,crypt:options.blob.key};
      
      $scope.userBlob = options.blob;
      self.setUsername(options.username);
      self.setAccount(options.blob.data.account_id);
      self.setLoginKeys(keys);
      self.storeLoginKeys(options.blob.url, options.username, keys);
      store.set('device_id', options.blob.device_id);
      self.loginStatus = true;
      $scope.loginStatus = true;
      $scope.$broadcast('$blobUpdate');
      store.set('ripple_known', true);  
      callback();          
    });
  };
  
  Id.prototype.logout = function ()
  {
    store.remove('ripple_auth');

    //remove deviceID if remember me is not set
    if (!store.get('remember_me')) {
      store.remove('device_id');  
    }
    
    // TODO make it better
    //this.account = '';
    //this.keys = {};
    //this.loginStatus = false;
    //$scope.loginStatus = false;
    //this.username = '';
    //
    //$scope.address = '';
//    $location.path('/login');

    // problem?
    // reload will not work, as some pages are also available for guests.
    // Logout will show the same page instead of showing login page.
    // This line redirects user to root (login) page
//    var port = location.port.length > 0 ? ":" + location.port : "";
//    location.href = location.protocol + '//' + location.hostname  + port + location.pathname;
  };

  Id.prototype.unlock = function (username, password, callback)
  {
    var self = this;

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    //username = Id.normalizeUsernameForDisplay(username);
    //password = Id.normalizePassword(password);

    $authflow.unlock(username, password, function (err, resp) {
      if (err) {
        callback(err);
        return;
      }
    
      callback(null, resp.secret);
    });
  };

  /**
   * Go to an identity page.
   *
   * Redirects the user to a page where they can identify. This could be the
   * login or register tab most likely.
   */
  Id.prototype.goId = function () {
    if (!this.isLoggedIn()) {
      if (_.size($routeParams)) {
        var tab = $route.current.tabName;
        $location.search('tab', tab);
        $location.path('/login');
        return;
      }

      if (this.isReturning()) {
        $location.path('/login');
      } else {
        $location.path('/register');
      }
    }
  };

  /**
 * Find Ripple Name
 *
 * Find a ripple name for a given ripple address
   */
  Id.prototype.resolveNameSync = function (address, options) {
    if(!this.resolvedNames[address]) {
      if(!this.serviceInvoked[address]) {
        this.resolveName(address, options);
      }
      return address;
    }
    return this.resolvedNames[address];
  }

  /**
 * Find Ripple Name
 *
 * Find a ripple name for a given ripple address
   */
  Id.prototype.resolveName = function (address, options) {
    var self = this;
    var deferred = $q.defer();
    var strippedValue = webutil.stripRippleAddress(address);
    var rpAddress = ripple.UInt160.from_json(strippedValue);
    if (!rpAddress.is_valid()) {
      deferred.resolve(address);
      return deferred.promise;
    }

    var opts = jQuery.extend(true, {}, options);

    if(!this.resolvedNames[address]) {
      if(!this.serviceInvoked[address]) {
        this.serviceInvoked[address] = true;

        // Get the blobvault url
        ripple.AuthInfo.get(Options.domain, "1", function(err, authInfo) {
          if (err) {
            console.log("Can't get the authinfo data", err);
            deferred.reject(err);
          } else {
            // Get the user
            $http.get(authInfo.blobvault + '/v1/user/' + strippedValue)
              .success(function(data) {
                if (data.username) {
                  if (opts.tilde === true) {
                    self.resolvedNames[address] = "~".concat(data.username);
                  } else {
                    self.resolvedNames[address] = data.username;
                  }
                } else {
                  // Show the ripple address if there's no name associated with it
                  self.resolvedNames[address] = address;
                }
                deferred.resolve(self.resolvedNames[address]);
              })
              .error(function(err){
                console.log("Can't get the blobvault", err);
                deferred.reject(err);
              });
          }
        });
      } else {
        deferred.resolve(address);
      }
    } else {
      deferred.resolve(self.resolvedNames[address]);
    }
    return deferred.promise;
  };

  $scope.$watch('loginStatus', function (loginStatus){
    if (loginStatus) {
      $scope.showLogin = false;
    }
  });

  $scope.$on('$routeChangeStart', function (ev, next) {
    if (!$scope.loginStatus) {
      var tab = next.tabName;

      if (tab !== 'register' && tab !== 'migrate' && tab !== 'recover' && tab !== '404' && tab !== 'privacypolicy' && tab !== 'tou') {
        $scope.showLogin = true;
        return;
      }
    }

    $scope.showLogin = false;
  });

  return new Id();
}]);


