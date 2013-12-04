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
require('../directives/jade');
require('../directives/errors');
require('../filters/filters');
require('../services/globalwrappers');
require('../services/id');
require('../services/tracker');
require('../services/oldblob');
require('../services/network');
require('../services/books');
require('../services/transactions');
require('../services/ledger');
require('../services/popup');
require('../services/rippletxt');
require('../services/federation');
require('../services/domainalias');
require('../services/zipzap');

var app = angular.module('rp', [
  'ng',
  // Controllers
  'app',
  'status',
  // Services
  'id',
  'tracker',
  // Directives
  'charts',
  'effects',
  'events',
  'fields',
  'formatters',
  'directives',
  'validators',
  'datalinks',
  'jade',
  'errors',
  // Filters
  'filters',
  'zipzap'
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

  // Once the app controller has been instantiated
  // XXX ST: I think this should be an event instead of a watch
  scope.$watch("app_loaded", function on_app_loaded(oldval, newval) {
    $('nav a').click(function() {
      if (location.hash == this.hash) {
        scope.$apply(function () {
          $route.reload();
        });
      }
    });
  });
}]);

// Some backwards compatibility
if (!Options.blobvault) {
  Options.blobvault = Options.BLOBVAULT_SERVER;
}
