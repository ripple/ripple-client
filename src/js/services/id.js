/**
 * ID
 *
 * The id service is used for user identification and authorization.
 */

var util = require('util'),
    Base58Utils = require('../util/base58'),
    RippleAddress = require('../util/types').RippleAddress;

var module = angular.module('id', ['blob']);

module.factory('rpId', ['$rootScope', '$location', '$route', '$routeParams', 'rpOldBlob',
                        function($scope, $location, $route, $routeParams, $oldblob)
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

    this.blobBackends = store.get('ripple_blobBackends')
      ? store.get('ripple_blobBackends')
      : ['vault', 'local'];
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
   * Strips whitespace at beginning and end.
   */
  Id.normalizeUsername = function (username) {
    username = ""+username;
    username = username.trim();
    //we should display username with same capitalization as how they enter it in open wallet
    // toLowerCase used in all blob requests
    // username = username.toLowerCase();
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

    $scope.blobBackendCollections = [
      {name: 'Payward', 'value':'vault'},
      {name: 'Payward, Local Browser', 'value':'vault,local'},
      {name: 'Local Browser', 'value':'local'}
    ];

    var blobBackend = store.get('ripple_blobBackends')
          ? $.grep($scope.blobBackendCollections, function(e){ return e.value === store.get('ripple_blobBackends'); })[0]
        : $scope.blobBackendCollections[1];

    $scope.blobBackendCollection = {something: blobBackend};

    $scope.userBlob = Id.defaultBlob;
    $scope.userCredentials = {};

    $scope.$watch('userBlob',function(){
      // XXX Maybe the blob service should handle this stuff?
      $scope.$broadcast('$blobUpdate');

      if (self.username && self.password) {
        $oldblob.set(self.blobBackends,
                  self.username.toLowerCase(), self.password,
                  $scope.userBlob,function(){
                    $scope.$broadcast('$blobSave');
                  });
      }
    },true);

    $scope.$on('$blobUpdate', function(){
      // Account address
      if (!$scope.address && $scope.userBlob.data.account_id) {
        $scope.address = $scope.userBlob.data.account_id;
      }
    });

    if (Options.persistent_auth && !!store.get('ripple_auth')) {
      var auth = store.get('ripple_auth');

      // XXX This is technically not correct, since we don't know yet whether
      //     the login will succeed. But we need to set it now, because the page
      //     controller will likely query it long before we get a response from
      //     the login system.
      //
      //     Probably not a big deal as persistent_auth is only used by
      //     developers.
      self.loginStatus = true;
      this.login(auth.username, auth.password, function (err) {
        // XXX If there was a login error, we're now in a broken state.
      });
    }
  };

  Id.prototype.setUsername = function (username)
  {
    this.username = username;
    $scope.userCredentials.username = username;
    $scope.$broadcast('$idUserChange', {username: username});
  };

  Id.prototype.setPassword = function (password)
  {
    this.password = password;
    $scope.userCredentials.password = password;
  };

  Id.prototype.setAccount = function (accId, accKey)
  {
    if (this.account !== null) {
      $scope.$broadcast('$idAccountUnload', {account: accId});
    }
    this.account = accId;
    $scope.userCredentials.account = accId;
    $scope.userCredentials.master_seed = accKey;
    $scope.$broadcast('$idAccountLoad', {account: accId, secret: accKey});
  };

  Id.prototype.isReturning = function ()
  {
    return !!store.get('ripple_known');
  };

  Id.prototype.isLoggedIn = function ()
  {
    return this.loginStatus;
  };

  Id.prototype.storeLogin = function (username, password)
  {
    if (Options.persistent_auth) {
      store.set('ripple_auth', {username: username, password: password});
    }
  };

  Id.prototype.register = function (username, password, callback, masterkey)
  {
    var self = this;

    // If Secret Account Key is not present, generate one
    masterkey = !!masterkey
      ? masterkey
      : Base58Utils.encode_base_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)));

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    // Blob data
    username = Id.normalizeUsername(username);
    password = Id.normalizePassword(password);

    var data = {
      data: {
        master_seed: masterkey,
        account_id: (new RippleAddress(masterkey)).getAddress(),
        contacts: []
      },
      meta: {
        created: (new Date()).toJSON(),
        modified: (new Date()).toJSON()
      }
    };

    // Add user to blob
    $oldblob.set(self.blobBackends, username.toLowerCase(), password, data, function () {
      $scope.userBlob = data;
      self.setUsername(username);
      self.setPassword(password);
      self.setAccount(data.data.account_id, data.data.master_seed);
      self.storeLogin(username, password);
      self.loginStatus = true;
      $scope.$broadcast('$blobUpdate');
      store.set('ripple_known', true);
      callback(data.data.master_seed);
    });
  };

  Id.prototype.exists = function (username, password, callback)
  {
    var self = this;

    username = Id.normalizeUsername(username);
    password = Id.normalizePassword(password);

    $oldblob.get(self.blobBackends, username.toLowerCase(), password, function (err, data) {
      if (!err && data) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    });
  };

  Id.prototype.login = function (username, password, callback)
  {
    var self = this;

    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    username = Id.normalizeUsername(username);
    password = Id.normalizePassword(password);

    $oldblob.get(self.blobBackends, username.toLowerCase(), password, function (err, data) {
      if (err) {
        callback(err);
        return;
      }

      var blob = $oldblob.decrypt(username.toLowerCase(), password, data);
      if (!blob) {
        // Unable to decrypt blob
        var msg = 'Unable to decrypt blob (Username / Password is wrong)';
        callback(new Error(msg));
        return;
      } else if (blob.old && !self.allowOldBlob) {
        var oldBlobErr = new Error('Old blob format detected');
        oldBlobErr.name = "OldBlobError";
        callback(oldBlobErr);
        return;
      }

      // Ensure certain properties exist
      $.extend(true, blob, Id.minimumBlob);

      $scope.userBlob = {
        data: blob.data,
        meta: blob.meta
      };
      self.setUsername(username);
      self.setPassword(password);
      self.setAccount(blob.data.account_id, blob.data.master_seed);
      self.storeLogin(username, password);
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
    });
  };

  Id.prototype.logout = function ()
  {
    store.remove('ripple_auth');

    // problem?
    // reload will not work, as some pages are also available for guests.
    // Logout will show the same page instead of showing login page.
    // This line redirects user to root (login) page
    var port = location.port.length > 0 ? ":" + location.port : "";
    location.href = location.protocol + '//' + location.hostname  + port + location.pathname;
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


