var util = require('util'),
    events = require('events'),
    webutil = require('./webutil'),
    log = require('./log'),
    App = require('./app').App;

var TabManager = function ()
{
  this.slots = {};
  this.lastSeenHash = null;
};

TabManager.prototype.init = function ()
{
  if (this.app.id.isReturning()) {
    console.log("returning user");
    try {
      if (location.hash.length < 2) throw "nohash";

      this.handleHashChange();
    } catch (e) {
      this.gotoTab("login");
    }
  } else {
    this.gotoTab("register");
  }
};

TabManager.prototype.setApp = function (app)
{
  this.app = app;
};

TabManager.pageModes = ['default', 'single'];

TabManager.prototype.setPageMode = function (mode)
{
  if (~TabManager.pageModes.indexOf(mode)) {
    var htmlEl = $('html');
    webutil.removeClassPrefix(htmlEl, 'pm-');
    htmlEl.addClass('pm-'+mode);
  } else {
    throw new Error("Invalid page mode requested: '"+mode+"'.");
  }
};

TabManager.prototype.gotoTab = function (tabName, callback)
{
  this.lastSeenHash = "#"+tabName;
  location.hash = "#"+tabName;
  this.showTab(tabName, callback);
}

TabManager.prototype.showTab = function (tabName, callback)
{
  this.showTabInSlot(tabName, tabName, callback);
};

TabManager.prototype.showSlot = function (slotName)
{
  if ("undefined" !== typeof this.slots[slotName]) {
    this.slots[slotName].show();
  }
}

TabManager.prototype.showTabInSlot = function (tabName, slotName, callback)
{
  var tab,
      self = this;

  if ("undefined" !== typeof this.slots[slotName]) {
    tab = this.slots[slotName];
    tab.show();

    if ("function" === typeof callback) {
      callback(tab);
    }
  } else if ("function" === typeof TabManager.tabs[tabName]) {
    var tabLoader = TabManager.tabs[tabName];
    tabLoader(function (TabClass) {
      var tab = new TabClass();
      tab.setTabManager(self);
      tab.render(slotName, function () {
        tab.show();

        if ("function" === typeof callback) {
          callback(tab);
        }
      });
    });
  } else {
    throw new Error("Unknown tab '"+tabName+"'.");
  }
};

TabManager.prototype.hideSlot = function (slotName)
{
  if ("undefined" !== typeof this.slots[slotName]) {
    this.slots[slotName].hide();
  }
};

TabManager.prototype.getContainer = function ()
{
  return $('#main');
};

TabManager.prototype.getAllTabEls = function ()
{
  return $('section');
}

TabManager.prototype.handleHashChange = function () {
  if (location.hash == this.lastSeenHash) return;

  this.lastSeenHash = location.hash;

  this.showTab(location.hash.slice(1));
};

TabManager.prototype.getSlotByEl = function (el) {
  var id = $(el).attr('id');
  if (id.slice(0, 2) === 't-') {
    var slot = id.slice(2);

    return slot;
  }
};

TabManager.prototype.getElBySlot = function (slotName) {
  var el = $('#t-'+slotName);
  if (!el.length) {
    return null;
  } else {
    return el;
  }
};

//
// TAB DEFINITIONS
//
// These definitions exist so that webpack can create lazily loaded
// chunks for different tabs. Tabs using require.ensure are loaded
// lazily, tabs using pure require are included in the base package.
//

TabManager.tabs = {};

TabManager.tabs["register"] = function (callback) {
  callback(require('../tabs/register'));
};

TabManager.tabs["login"] = function (callback) {
  callback(require('../tabs/login'));
};

TabManager.tabs["account"] = function (callback) {
  callback(require('../tabs/account'));
};

TabManager.tabs["my-ripple"] = function (callback) {
  callback(require('../tabs/my-ripple'));
};

TabManager.tabs["history"] = function (callback) {
  callback(require('../tabs/history'));
};

TabManager.tabs["contacts"] = function (callback) {
  callback(require('../tabs/contacts'));
};

TabManager.tabs["exchange"] = function (callback) {
  callback(require('../tabs/exchange'));
};

TabManager.tabs["rates"] = function (callback) {
  callback(require('../tabs/rates'));
};

TabManager.tabs["trust"] = function (callback) {
  callback(require('../tabs/trust'));
};

TabManager.tabs["send"] = function (callback) {
  callback(require('../tabs/send'));
};

TabManager.tabs["receive"] = function (callback) {
  callback(require('../tabs/receive'));
};

var Tab = function (config)
{
  events.EventEmitter.call(this);

  this.app = App.singleton;
};
util.inherits(Tab, events.EventEmitter);

Tab.prototype.pageMode = 'default';

/**
 * Where this tab belongs in the DOM.
 *
 * If set, this is where the tab is added in the DOM when it has been
 * requested. If this property is not defined, we expect the tab to
 * already exist in the default HTML template.
 *
 * This property should be set to the slotname of the parent tab.
 */
Tab.prototype.parent = null;

/**
 * Whether this tab is a container to other tabs.
 *
 * If set to a string, this property denotes the tabname of the
 * default child tab. This child tab will be opened automatically if
 * the parent is activated without any children being active.
 *
 * If this property is not set, the engine will look if there are
 * child tabs defined in this tab's DOM. If there are some, the first
 * child tab will be assumed to be the default. If there are none, the
 * tab will be assumed to not be a container.
 */
Tab.prototype.defaultChild = null;

/**
 * AngularJS dependencies.
 *
 * List any controllers the tab uses here.
 */
Tab.prototype.angularDeps = [];

Tab.prototype.setTabManager = function (tm)
{
  this.tm = tm;
};

Tab.prototype.render = function (slot, callback)
{
  var self = this;

  this.emit('beforerender');
  this.slot = slot;
  this.el = this.tm.getElBySlot(this.slot);
  if (!this.el) {
    var parentEl;
    if (!this.parent) {
      throw new Error('Tabs that specify no parent must already be on'
                      + ' the page, but this one isn\'t.');
    } else if (this.parent === 'main') {
      parentEl = this.tm.getContainer();
    } else {
      parentEl = this.tm.getElBySlot(this.parent);
    }
    if (!parentEl) {
      throw new Error('Loaded tab without parent tab "'+this.parent+'" '
                      + 'present!');
    }

    var html = this.generateHtml();

    if (this.angular) {
      // Generate a new scope below the container's scope
      var $scope = angular.element(parentEl).scope().$new();

      // We'll represent our tab as a module
      var module = angular.module(this.slot, this.angularDeps);

      // The tab can define it's own controllers, filters, etc.
      this.angular(module);

      // The injector is what will actually instantiate our new module
      var $injector = angular.injector(['ng', this.slot]);

      $injector.invoke(function ($compile) {
        $scope.$apply(function () {
          self.el = $compile(html)($scope);
          self.el.attr('id', 't-'+self.slot);
          self.el.appendTo(parentEl);
          self.emit('afterrender');
          self.tm.slots[slot] = self;
          callback();
        });
      });
      return;
    } else {
      this.el = $(html);
      this.el.attr('id', 't-'+this.slot);
      this.el.appendTo(parentEl);
    }
  }
  this.emit('afterrender');
  this.tm.slots[slot] = this;
  callback();
};

Tab.prototype.getEl = function ()
{
  return this.el;
};

Tab.prototype.show = function ()
{
  this.emit('beforeshow');
  if (this.showOneChild()) return;
  this.hideSiblings();
  this.tm.setPageMode(this.pageMode);

  // Update menu .active
  var menuEl = $("a[href='#"+this.slot+"']").parent();
  var menuGroup = menuEl.parent().parent().find('li');
  menuGroup.removeClass("active");
  menuEl.addClass("active");

  // Update global CSS tab indicator
  var htmlEl = $('html');
  webutil.removeClassPrefix(htmlEl, 't-');
  htmlEl.addClass('t-'+this.slot);
  this.el.children("section.active").each(function () {
    htmlEl.addClass($(this).attr('id'));
  });

  this.el.addClass('active');
  this.showParents();
  this.emit('aftershow');
};

Tab.prototype.hide = function ()
{
  this.emit('beforehide');
  this.el.removeClass('active');
  this.emit('afterhide');
};

Tab.prototype.showParents = function ()
{
  var self = this;

  this.el.parents('section').each(function () {
    var slot = self.tm.getSlotByEl(this);
    self.tm.showTab(slot);
  });
};

Tab.prototype.hideSiblings = function ()
{
  var self = this;

  this.el.siblings('section').each(function () {
    var slot = self.tm.getSlotByEl(this);
    if (slot === self.slot) return;
    self.tm.hideSlot(slot);
  });
};

/**
 * Make sure container always have at least one child activated.
 *
 * Without this function we might get an empty container showing
 * without any content if the container is accessed without a specific
 * child being referenced.
 *
 * For example, somebody might open #account, instead of linking to
 * one of the subsections like #my-ripple.
 *
 * In this case we want to show the defaultSection or, if none is
 * specified, the first child section.
 */
Tab.prototype.showOneChild = function ()
{
  var domChildTabs,
      defaultChild;

  domChildTabs = this.el.find('section');

  // If any children are visible, we're done
  if (domChildTabs.is(".active")) return false;

  if (this.defaultChild) {
    // Use explicitly defined default child
    defaultChild = this.defaultChild;
  } else if (domChildTabs.length) {
    defaultChild = this.tm.getSlotByEl(domChildTabs.eq(0));
  } else {
    // This element is not a container at all
    return false;
  }

  this.tm.showTab(defaultChild);
  return true;
};

exports.TabManager = TabManager;
exports.Tab = Tab;
