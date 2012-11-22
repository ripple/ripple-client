var blob = require('./blob').BlobObj,
    events = require('events'),
    util = require('util');

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
  var self = this;

  blob.get('vault', 'god', 'dog', function (err, blob) {
    self.setAccount(blob.data.account_id, blob.data.master_seed);
    console.log(blob.data);
  });
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

Id.prototype.register = function ()
{
  store.set('ripple_known', true);
};

Id.prototype.login = function ()
{
  store.set('ripple_known', true);
};

module.exports.Id = Id;

