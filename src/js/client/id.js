var blob = require('./blob').BlobObj,
    events = require('events'),
    util = require('util'),
    Base58Utils = require('./base58'),
    RippleAddress = require('./types').RippleAddress;

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
  // Initializing sjcl.random doesn't really belong here, but there is no other
  // good place for it yet.
  for (var i = 0; i < 8; i++) {
    sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
  }

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

Id.prototype.setPassword = function (password)
{
  this.password = password;
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
  blob.set('vault',username,password,data,function(){
    self.data = data;
    self.setUsername(username);
    self.setPassword(password);
    self.setAccount(data.data.account_id, data.data.master_seed);
    self.storeLogin(username, password);
    self.loginStatus = true;
    self.emit('blobupdate');
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
      self.data = {
        data: blob.data,
        meta: blob.meta
      };
      self.setUsername(username);
      self.setPassword(password);
      self.setAccount(blob.data.account_id, blob.data.master_seed);
      self.storeLogin(username, password);
      self.loginStatus = true;
      console.log("Login status set");
      self.emit('blobupdate');
      store.set('ripple_known', true);
    }
    if ("function" === typeof callback) {
      callback(null, !!blob.data.account_id);
    }
  });
};

/**
 * Update contacts
 * @param contacts
 */
Id.prototype.setContacts = function (contacts)
{
  var self = this;
  this.data.data.contacts = contacts;

  // Update blob
  blob.set('vault',this.username,this.password,this.data,function(){
    self.emit('blobupdate');
  });
}

Id.prototype.getContacts = function (callback)
{
  return this.data.data.contacts ? this.data.data.contacts : [];

  /*return callback([{
   name: 'Bob',
   address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
   },{
   name: 'John',
   address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRA'
   },{
   name: 'James',
   address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRG'
   },{
   name: 'Stuart',
   address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRD'
   },{
   name: 'Gugo',
   address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRE'
   },{
   name: 'Gago',
   address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRF'
   }])*/
}

Id.prototype.getContactNames = function ()
{
  var names = [];

  if (this.data.data.contacts) {
    for (var i=0; i<this.data.data.contacts.length; i++) {
      names.push(this.data.data.contacts[i].name);
    }
  }

  return names;
}

module.exports.Id = Id;