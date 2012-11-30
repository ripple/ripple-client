var blob = require('./blob').BlobObj,
    events = require('events'),
    util = require('util'),
    Base58Utils = require('../client/base58'),
    RippleAddress = require('../client/types').RippleAddress;

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
};
util.inherits(Id, events.EventEmitter);

Id.prototype.init = function ()
{
  if (Options.persistent_auth && !!store.get('ripple_auth')) {
    var auth = store.get('ripple_auth');

    this.login(auth.username, auth.password);
    console.log("Login status set");
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
  this.emit('userchange', {username: username});
};

Id.prototype.setAccount = function (accId, accKey)
{
  if (this.account !== null) {
    this.emit('accountunload', {account: this.account});
  }
  this.account = accId;
  this.emit('accountload', {account: this.account, secret: accKey});
};

Id.prototype.isReturning = function ()
{
  return !!store.get('ripple_known');
};

Id.prototype.isLoggedIn = function ()
{
  console.log("Login status checked");
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

  self.data = {
    master_seed: Base58Utils.encode_base_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)))
  };

  self.data.account_id = (new RippleAddress(this.data.master_seed)).getAddress();

  self.meta = {
    created: (new Date()).toJSON(),
    modified: (new Date()).toJSON()
  };

  var hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(username + password));
  var ct = sjcl.encrypt(username + password, JSON.stringify(self.data), {
    iter: 1000,
    adata: JSON.stringify(self.meta),
    ks: 256
  });

  // Add user to blob
  blob.set('vault',hash,btoa(ct),function(){
    self.setUsername(username);
    self.setAccount(self.data.account_id, self.data.master_seed);
    self.storeLogin(username, password);
    self.loginStatus = true;
    store.set('ripple_known', true);
    callback();
  });
};

Id.prototype.login = function (username,password,callback)
{
  var self = this;

  if ("function" !== typeof callback) callback = $.noop;

  blob.get('vault', username, password, function (err, blob) {
    if (err) {
      callback(err);
      return;
    }
    if (blob.data.account_id) {
      self.setUsername(username);
      self.setAccount(blob.data.account_id, blob.data.master_seed);
      self.storeLogin(username, password);
      self.loginStatus = true;
      console.log("Login status set");
      store.set('ripple_known', true);
    }
    if ("function" === typeof callback) {
      callback(null, !!blob.data.account_id);
    }
  });

};

module.exports.Id = Id;

