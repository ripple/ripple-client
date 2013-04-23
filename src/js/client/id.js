var blob = require('./blob').BlobObj,
    events = require('events'),
    util = require('util'),
    Base58Utils = require('../util/base58'),
    RippleAddress = require('../util/types').RippleAddress;

/**
 * Identity manager
 *
 * This class manages the encrypted blob and all user-specific state.
 */
var Id = function ()
{
  events.EventEmitter.call(this);

  this.account = null;
  this.loginStatus = false;

  this.blobBackends = store.get('ripple_blobBackends')
      ? store.get('ripple_blobBackends')
      : ['vault', 'local'];
};

util.inherits(Id, events.EventEmitter);

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

  this.app.$scope.blobBackendCollections = [
    {name: 'Payward', 'value':'vault'},
    {name: 'Payward, Local Browser', 'value':'vault,local'},
    {name: 'Local Browser', 'value':'local'}
  ];

  var blobBackend = store.get('ripple_blobBackends')
      ? $.grep(this.app.$scope.blobBackendCollections, function(e){ return e.value == store.get('ripple_blobBackends'); })[0]
      : this.app.$scope.blobBackendCollections[1];

  this.app.$scope.blobBackendCollection = {something: blobBackend};

  this.app.$scope.userBlob = Id.defaultBlob;
  this.app.$scope.userCredentials = {};

  this.app.$scope.$watch('userBlob',function(){
    self.emit('blobupdate');

    if (self.username && self.password) {
      blob.set(self.blobBackends,
               self.username.toLowerCase(), self.password,
               self.app.$scope.userBlob,function(){
        self.emit('blobsave');
      });
    }
  },true);

  self.on('blobupdate', function(){
    // Account address
    if (!self.app.$scope.address && self.app.$scope.userBlob.data.account_id) {
      self.app.$scope.address = self.app.$scope.userBlob.data.account_id;
    }

    if(!self.app.$scope.$$phase) {
      self.app.$scope.$digest();
    }
  });

  if (Options.persistent_auth && !!store.get('ripple_auth')) {
    var auth = store.get('ripple_auth');

    this.login(auth.username, auth.password);
    this.loginStatus = true;
  }
};

Id.prototype.setApp = function (app)
{
  this.app = app;
};

Id.prototype.setUsername = function (username)
{
  this.username = username;
  this.app.$scope.userCredentials.username = username;
  this.emit('userchange', {username: username});
};

Id.prototype.setPassword = function (password)
{
  this.password = password;
  this.app.$scope.userCredentials.password = password;
};

Id.prototype.setAccount = function (accId, accKey)
{
  if (this.account !== null) {
    this.emit('accountunload', {account: this.account});
  }
  this.account = accId;
  this.app.account = accId;
  this.app.$scope.userCredentials.account = accId;
  this.app.$scope.userCredentials.master_seed = accKey;
  this.emit('accountload', {account: this.account, secret: accKey});
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
}

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
  blob.set(self.blobBackends, username.toLowerCase(), password, data, function () {
    self.app.$scope.userBlob = data;
    self.setUsername(username);
    self.setPassword(password);
    self.setAccount(data.data.account_id, data.data.master_seed);
    self.storeLogin(username, password);
    self.loginStatus = true;
    self.emit('blobupdate');
    store.set('ripple_known', true);
    callback(data.data.master_seed);
  });
};

Id.prototype.login = function (username,password,callback)
{
  var self = this;

  // Callback is optional
  if ("function" !== typeof callback) callback = $.noop;

  username = Id.normalizeUsername(username);
  password = Id.normalizePassword(password);

  blob.get(self.blobBackends, username.toLowerCase(), password, function (backendName, err, blob) {
    if (err) {
      callback(backendName,err);
      return;
    }

    // Ensure certain properties exist
    $.extend(true, blob, Id.minimumBlob);

    self.app.$scope.userBlob = {
      data: blob.data,
      meta: blob.meta
    };
    self.setUsername(username);
    self.setPassword(password);
    self.setAccount(blob.data.account_id, blob.data.master_seed);
    self.storeLogin(username, password);
    self.loginStatus = true;
    self.emit('blobupdate');
    store.set('ripple_known', true);

    callback(backendName, null, !!blob.data.account_id);
  });
};

Id.prototype.logout = function ()
{
  store.remove('ripple_auth');

  // problem?
  // reload will not work, as some pages are also available for guests.
  // Logout will show the same page instead of showing login page.
  // This line redirects user to root (login) page
  location.href = location.protocol + '//' + location.hostname + location.pathname;
};

module.exports.Id = Id;
