var types = require('../util/types');

// Load app modules
require('../controllers/app');
require('../controllers/status');
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
require('../services/oldblob');
require('../services/network');
require('../services/books');
require('../services/transactions');
require('../services/ledger');
require('../services/popup');
require('../services/rippletxt');
require('../services/federation');
require('../services/domainalias');

var app = angular.module('rp', [
  'ng',
  // Controllers
  'app',
  'status',
  // Services
  'id',
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
]);

// Global reference for debugging only (!)
var rippleclient = window.rippleclient = {};
rippleclient.app = app;
rippleclient.types = types;

var tabs = require('../client/tabdefs');

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

        if (tab.extraRoutes) {
          _.each(tab.extraRoutes, function(route) {
            $.extend({}, config, route.config);
            $routeProvider.when(route.name, config);
          });
        }

        _.each(tab.aliases, function (alias) {
          $routeProvider.when('/'+alias, config);
        });
      }
    });
  });

  $routeProvider.otherwise({redirectTo: '/balance'});
}]);

app.run(['$rootScope', '$injector', '$compile', '$route', '$routeParams', '$location',
         function ($rootScope, $injector, $compile, $route, $routeParams, $location)
{
  // Global reference for debugging only (!)
  if ("object" === typeof rippleclient) {
    rippleclient.$scope = $rootScope;
  }

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
  $('#main').data('$scope', scope);

  // If using the old "amnt" parameter rename it "amount"
  var amnt = $location.search().amnt;
  if (amnt) {
    $location.search("amnt", null);
    $location.search("amount", amnt);
  }
}]);

// Some backwards compatibility
if (!Options.blobvault) {
  Options.blobvault = Options.BLOBVAULT_SERVER;
}
