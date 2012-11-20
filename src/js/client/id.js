/**
 * Identity manager
 *
 * This class manages the encrypted blob and all user-specific state.
 */
var Id = function ()
{
  this.online = true;

  if (!store || !store.enabled) {
    console.warn("No persistence available!");
    this.online = false;
    // XXX This case isn't really handled yet
  }
};

Id.prototype.init = function ()
{
  // Nothing here yet
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

