/**
 * ID
 *
 * The id service is used for user identification and authorization.
 */

var util = require('util'),
    Base58Utils = require('../util/base58'),
    RippleAddress = require('../util/types').RippleAddress;

var module = angular.module('id', ['authflow', 'blob', 'oldblob']);

module.factory('rpId', ['$rootScope', '$location', '$route', '$routeParams',
                        'rpAuthFlow', 'rpBlob', 'rpOldBlob',
                        function($scope, $location, $route, $routeParams,
                                 $authflow, $blob, $oldblob)
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
      var auth = store.get('ripple_auth');

      if (auth.keys) {

        // XXX This is technically not correct, since we don't know yet whether
        //     the login will succeed. But we need to set it now, because the page
        //     controller will likely query it long before we get a response from
        //     the login system.
        //
        //     Will work fine as long as any relogin error triggers a logout and
        //     logouts trigger a full page reload.
        self.loginStatus = true;
  
        $authflow.relogin(auth.url, auth.keys, function (err, blob) {
          if (err) {
            // Failed to relogin, logout
            console.log("client: id: failed to relogin:", err.toString());
            self.logout();
          } else {
            // Ensure certain properties exist
            $.extend(true, blob, Id.minimumBlob);

            $scope.userBlob = blob;
            self.setUsername(auth.username);
            self.setAccount(blob.data.account_id);
            self.setLoginKeys(auth.keys);
            self.loginStatus = true;
            $scope.$broadcast('$blobUpdate');
            store.set('ripple_known', true);

            /*if (blob.data.account_id) {
              // Success
              callback(null);
            } else {
              // Invalid blob
              callback(new Error("Blob format unrecognized!"));
            }*/
          }
        });
      }
    }
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

    var account = (new RippleAddress(masterkey)).getAddress();

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

      if ('desktop' === $scope.client) {
        self.setAccount(blob.data.account_id);
        self.loginStatus = true;
        $scope.$broadcast('$blobUpdate');
      }

      // Remove old blob
      $oldblob.remove(['vault', 'local'], opts.oldUsername, opts.oldPassword, function (err, data) {
        if (err) {
          console.log("Can't delete the old blobvault:", err);
          return;
        }

        console.log('Old blob has been removed.');
      });

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

  Id.prototype.login = function (opts, callback)
  {
    var self = this;

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    var username = Id.normalizeUsernameForDisplay(opts.username);
    var password = Id.normalizePassword(opts.password);

    $authflow.login({
      'username': Id.normalizeUsernameForInternals(username),
      'password': password,
      'walletfile': opts.walletfile
    }, function (err, blob, keys, actualUsername, emailVerified) {
      if (err && Options.blobvault) {
        console.log("Blob login failed, trying old blob protocol");

        $oldblob.get(['vault', 'local'], Id.normalizeUsernameForInternals(username), password, function (oerr, data) {
          if (oerr) {
            // Old blob failed - since this was just the fallback report the
            // original error
            console.log("Old backend reported:", oerr);
            callback(err);
            return;
          }

          var blob = $oldblob.decrypt(Id.normalizeUsernameForInternals(username), password, data);
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
            $scope.oldUsername = username.toLowerCase();
            $scope.oldPassword = password;
            $location.path('/register');

            return;
//            var migrateErr = new Error('Your account uses the old blob format,'
//                                       + ' please migrate your account.');
//            migrateErr.name = "NeedsMigrationError";
//            callback(migrateErr);
          }
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
        self.loginStatus = true;
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

  Id.prototype.logout = function ()
  {
    store.remove('ripple_auth');

    // TODO make it better
    this.account = '';
    this.keys = {};
    this.loginStatus = false;
    this.username = '';

    $scope.address = '';

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
      }
      if (this.isReturning()) {
        $location.path('/login');
      } else {
        $location.path('/register');
      }
    }
  };

  return new Id();
}]);


