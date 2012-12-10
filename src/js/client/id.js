var blob = require('./blob').BlobObj,
    events = require('events'),
    util = require('util'),
    Base58Utils = require('./base58'),
    RippleAddress = require('./types').RippleAddress;

/* Bob: rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV */

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

  this.blobBackends = ['vault', 'local'];
};

util.inherits(Id, events.EventEmitter);

// This object defines the minimum structure of the blob.
//
// This is used to ensure that the blob we get from the server has at least
// these fields and that they are of the right types.
Id.minimumBlob = {
  data: {
    contacts: []
  },
  meta: []
};

// The default blob is the blob that a new user gets.
//
// Right now this is equal to the minimum blob, but we may define certain
// default values here in the future.
Id.defaultBlob = Id.minimumBlob;

Id.prototype.init = function ()
{
  var self = this;

  // Initializing sjcl.random doesn't really belong here, but there is no other
  // good place for it yet.
  for (var i = 0; i < 8; i++) {
    sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
  }

  if (Options.persistent_auth && !!store.get('ripple_auth')) {
    var auth = store.get('ripple_auth');

    this.login(auth.username, auth.password);
    this.loginStatus = true;
  }

  this.app.$scope.userBlob = Id.defaultBlob;
  this.app.$scope.userCredentials = {};

  this.app.$scope.$watch('userBlob',function(){
    self.emit('blobupdate');
    if (self.username && self.password) {
      blob.set(self.blobBackends,
               self.username, self.password,
               self.app.$scope.userBlob,function(){
        self.emit('blobsave');
      });
    }
  },true);
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

Id.prototype.register = function (username, password, callback)
{
  var self = this;

  if ("function" !== typeof callback) callback = $.noop;

  var data = {
    data: {
      master_seed: Base58Utils.encode_base_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)))
    },
    meta: {
      created: (new Date()).toJSON(),
      modified: (new Date()).toJSON()
    }
  }

  data.data.account_id = (new RippleAddress(data.data.master_seed)).getAddress();

  // Add user to blob
  blob.set(self.blobBackends, username, password, data, function () {
    self.data = data;
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

  if ("function" !== typeof callback) callback = $.noop;

  blob.get(self.blobBackends, username, password, function (err, blob) {
    if (err) {
      console.warn('login failed');
      callback(err);
      return;
    }

    // Ensure certain properties exist
    $.extend(true, blob, Id.minimumBlob);

    if (blob.data.account_id) {
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
    }
    if ("function" === typeof callback) {
      callback(null, !!blob.data.account_id);
    }
  });
};

Id.prototype.logout = function ()
{
  store.remove('ripple_auth');
  this.loginStatus = false;
  this.app.tabs.gotoTab('login');
};

module.exports.Id = Id;
