/**
 * Manage application objects.
 *
 * This object represents an instance of the Ripple Client. It manages
 * the lifecycle of and provides references to various other
 * components.
 */
var App = function ()
{
  this.net = null;
  this.id = null;
  this.tabs = null;
  this.$scope = null;
  this.$compile = null;
};

App.prototype.setNetwork = function (net)
{
  this.net = net;
  net.setApp(this);
};

App.prototype.setId = function (id)
{
  this.id = id;
  id.setApp(this);
};

App.prototype.setTabManager = function (tabs)
{
  this.tabs = tabs;
  tabs.setApp(this);
};

/**
 * Set the AngularJS refs.
 */
App.prototype.setAngular = function (scope, compile)
{
  this.$scope = scope;
  this.$compile = compile;
};

App.prototype.startup = function ()
{
  var self = this;
  this.net.on('connect', function () {
    self.id.init();
    self.tabs.init();
  });
  this.net.listenId(this.id);
  this.net.init();
};

/**
 * Global identity manager.
 *
 * A singleton is an easy way for having a global object while still
 * maintaining a fairly sane upgrade path if we ever need multiple
 * instances to run in the same context.
 */
App.singleton = new App();

exports.App = App;
