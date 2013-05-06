var util = require('util'),
    webutil = require('../util/web'),
    log = require('../util/log');

var Tab = function (config)
{
};

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
