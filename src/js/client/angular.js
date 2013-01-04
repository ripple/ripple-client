/**
 * Binding between our application and AngularJS.
 *
 * In order to make Webpack and AngularJS play nicely together, we
 * have to do some extra work to load things correctly. This class
 * tries to abstract most of that complexity.
 */
var Angular = function ()
{

};

/**
 * Load default modules.
 *
 * In the future we may specify more load functions which fetch
 * other, optional components. That way such components can be
 * packaged separately by webpack and loaded on demand.
 */
Angular.load = function ()
{
  require('../directives/charts');
  require('../directives/fields');
  require('../directives/effects');
  require('../directives/validators');
  require('../directives/events');
  require('../directives/directives');
  require('../filters/filters');
  require('../services/network');
  require('../services/transactions');
  require('../services/ledger');
};

exports.Angular = Angular;
