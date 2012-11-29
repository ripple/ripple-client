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

  this.online = true;
  this.account = null;

  if (!store || !store.enabled) {
    console.warn("No persistence available!");
    this.online = false;
    // XXX This case isn't really handled yet
  }
};
util.inherits(Id, events.EventEmitter);

Id.prototype.init = function ()
{
};

Id.prototype.setApp = function (app)
{
  this.app = app;
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

Id.prototype.register = function (username, password, callback)
{
  var self = this;

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
    self.setAccount(self.data.account_id, self.data.master_seed);
    store.set('ripple_known', true);
    callback();
  });
};

Id.prototype.login = function (username,password,callback)
{
  var self = this;

  blob.get('vault', username, password, function (err, blob) {
    if (blob.data.account_id) {
      self.setAccount(blob.data.account_id, blob.data.master_seed);
      callback(true);
    } else {
      callback();
    }
  })

  store.set('ripple_known', true);
};

module.exports.Id = Id;

