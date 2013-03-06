var util = require('util'),
    events = require('events'),
    webutil = require('../util/web'),
    log = require('./log'),
    App = require('./app').App;

var Tab = function (config)
{
  events.EventEmitter.call(this);

  this.app = App.singleton;
};
util.inherits(Tab, events.EventEmitter);

Tab.prototype.pageMode = 'default';

Tab.prototype.mainMenu = 'none';

/**
 * AngularJS dependencies.
 *
 * List any controllers the tab uses here.
 */
Tab.prototype.angularDeps = [
  // Directives
  'charts',
  'effects',
  'events',
  'fields',
  'formatters',
  'directives',
  'validators',
  'datalinks',
  // Filters
  'filters'
];

/**
 * Other routes this tab should handle.
 */
Tab.prototype.aliases = [];

exports.Tab = Tab;
