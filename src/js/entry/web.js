var types = require('../util/types');

// Load app modules
require('../controllers/app');
require('../controllers/navbar');
require('../directives/charts');
require('../directives/fields');
require('../directives/effects');
require('../directives/validators');
require('../directives/events');
require('../directives/formatters');
require('../directives/directives');
require('../directives/datalinks');
require('../directives/errors');
require('../directives/qr');
require('../filters/filters');
require('../services/globalwrappers');
require('../services/id');
require('../services/tracker');
require('../services/blobRemote');
require('../services/oldblob');
require('../services/txqueue');
require('../services/authflowRemote');
require('../services/authinfo');
require('../services/kdf');
require('../services/keychain');
require('../services/network');
require('../services/books');
require('../services/transactions');
require('../services/ledger');
require('../services/popup');
require('../services/rippletxt');
require('../services/federation');
require('../services/domainalias');

require('../services/integration/appManager');
require('../services/integration/profileManager');
require('../services/integration/account');
require('../services/integration/history');
require('../services/integration/trust');
require('../services/integration/inboundBridge');

// Angular module dependencies
var appDependencies = [
  'ng',
  'ngRoute',
  // Controllers
  'app',
  'navbar',
  // Services
  'id',
  'tracker',
  'appManager',
  // Directives
  'charts',
  'effects',
  'events',
  'fields',
  'formatters',
  'directives',
  'validators',
  'datalinks',
  'errors',
  // Filters
  'filters',
  'ui.bootstrap'
];

// Load tabs
var tabdefs = [
  require('../tabs/register'),
  require('../tabs/login'),
  require('../tabs/balance'),
  require('../tabs/activity'),
  require('../tabs/history'),
  require('../tabs/contacts'),
  require('../tabs/exchange'),
  require('../tabs/account'),
  require('../tabs/trust'),
  require('../tabs/send'),
  require('../tabs/trade'),
  require('../tabs/options'),
  require('../tabs/security'),
  require('../tabs/tx'),
  require('../tabs/fund'),
  require('../tabs/withdraw'),
  require('../tabs/eula'),
  require('../tabs/kyc'),

  // Hidden tabs
  require('../tabs/apps'),
  require('../tabs/su')
];

// Prepare tab modules
var tabs = tabdefs.map(function (Tab) {
  var tab = new Tab();

  if (tab.angular) {
    var module = angular.module(tab.tabName, tab.angularDeps);
    tab.angular(module);
    appDependencies.push(tab.tabName);
  }

  return tab;
});

var app = angular.module('rp', appDependencies);

// Global reference for debugging only (!)
var rippleclient = window.rippleclient = {};
rippleclient.app = app;
rippleclient.types = types;

// Install basic page template
angular.element('body').prepend(require('../../jade/client/index.jade')());

app.config(['$routeProvider', '$injector', function ($routeProvider, $injector) {
  // Set up routing for tabs
  _.each(tabs, function (tab) {
    if ("function" === typeof tab.generateHtml) {
      var template = tab.generateHtml();

      var config = {
        tabName: tab.tabName,
        tabClass: 't-'+tab.tabName,
        pageMode: 'pm-'+tab.pageMode,
        mainMenu: tab.mainMenu,
        template: template
      };

      $routeProvider.when('/'+tab.tabName, config);

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

  // Language switcher
  $routeProvider.when('/lang/:language', {
    redirectTo: function(routeParams, path, search){
      lang = routeParams.language;

      if (lang == 'en') lang = '';

      if (!store.disabled) {
        store.set('ripple_language',lang ? lang : '');
      }

      // problem?
      // reload will not work, as some pages are also available for guests.
      // Logout will show the same page instead of showing login page.
      // This line redirects user to root (login) page
      var port = location.port.length > 0 ? ":" + location.port : "";
      location.href = location.protocol + '//' + location.hostname  + port + location.pathname;
    }
  });

  $routeProvider.otherwise({redirectTo: '/balance'});
}]);

app.run(['$rootScope', '$injector', '$compile', '$route', '$routeParams', '$location',
         function ($rootScope, $injector, $compile, $route, $routeParams, $location)
{
  // This is the web client
  $rootScope.client = 'web';
  $rootScope.productName = 'Ripple Trade';

  // Global reference for debugging only (!)
  if ("object" === typeof rippleclient) {
    rippleclient.$scope = $rootScope;
    rippleclient.version = $rootScope.version =
      angular.element('#version').text();
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

if ("function" === typeof angular.resumeBootstrap) angular.resumeBootstrap();
