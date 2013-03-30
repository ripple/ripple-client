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
  require('../directives/formatters');
  require('../directives/directives');
  require('../directives/datalinks');
  require('../filters/filters');
  require('../services/id');
  require('../services/network');
  require('../services/books');
  require('../services/transactions');
  require('../services/ledger');
  require('../services/popup');
  require('../services/rippletxt');
  require('../services/domainalias');
};


var app = angular.module('rp', [
  'ng',
  // Directives
  'id',
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
]);

var tabs = require('./tabdefs');

var capp = require('./app').App.singleton;

app.config(['$routeProvider', '$injector', function ($routeProvider, $injector) {
  _.each(tabs, function (tabLoader, tabName) {
    tabLoader(function (Tab) {
      var tab = new Tab();

      if (tab.angular) {
        var module = angular.module(tabName, tab.angularDeps);
        tab.angular(module);
        $injector.load([tabName]);
      }
      if ("function" === typeof tab.generateHtml) {
        var config = {
          tabName: tabName,
          tabClass: 't-'+tabName,
          pageMode: 'pm-'+tab.pageMode,
          mainMenu: tab.mainMenu,
          template: tab.generateHtml()
        };
        $routeProvider.when('/'+tabName, config);

        _.each(tab.aliases, function (alias) {
          $routeProvider.when('/'+alias, config);
        });
      }
    });
  });

  $routeProvider.otherwise({redirectTo: '/balance'});
}]);

app.run(['$rootScope', '$injector', '$compile', '$route', '$routeParams', '$location',
         function ($rootScope, $injector, $compile, $route, $routeParams, $location) {
  // Helper for detecting empty object enumerations
  $rootScope.isEmpty = function (obj) {
    return angular.equals({},obj);
  };

  // if url has a + or %2b then replace with %20 and redirect
  if (_.isArray($location.$$absUrl.match(/%2B|\+/gi))) 
    window.location = $location.$$absUrl.replace(/%2B|\+/gi, '%20');

  var scope = $rootScope;
  $rootScope.$route = $route;
  $rootScope.$routeParams = $routeParams;
  capp.setAngular(scope, $compile, $injector);
  capp.model.init();
  $('#main').data('$scope', scope);

  capp.startup();
}]);

exports.Angular = Angular;
