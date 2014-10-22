var types = require('../util/types');

// TODO don't use event tracking for desktop version.

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
require('../services/blobLocal');
require('../services/oldblob');
require('../services/txqueue');
require('../services/authflowLocal');
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
  require('../tabs/desktop/register'),
  require('../tabs/desktop/login'),
  require('../tabs/migrate'),
  require('../tabs/recover'),
  require('../tabs/balance'),
  require('../tabs/history'),
  require('../tabs/contacts'),
  require('../tabs/exchange'),
  require('../tabs/account'),
  require('../tabs/trust'),
  require('../tabs/send'),
  require('../tabs/trade'),
  require('../tabs/advanced'),
  require('../tabs/security'),
  require('../tabs/kyc'),
  require('../tabs/tx'),
  require('../tabs/xrp'),
  require('../tabs/btc'),
  require('../tabs/withdraw'),
  require('../tabs/usd'),
  require('../tabs/eula'),
  require('../tabs/twofa'),
  require('../tabs/brl'),

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

app.config(['$routeProvider', function ($routeProvider) {
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
    }
  });

  // Language switcher
  $routeProvider.when('/lang/:language', {
    redirectTo: function(routeParams, path, search){
      lang = routeParams.language;

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

app.run(['$rootScope', '$route', '$routeParams',
         function ($rootScope, $route, $routeParams)
{
  // This is the desktop client
  $rootScope.client = 'desktop';
  $rootScope.productName = 'Ripple';

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

  var scope = $rootScope;
  $rootScope.$route = $route;
  $rootScope.$routeParams = $routeParams;
  $('#main').data('$scope', scope);

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

if ("function" === typeof angular.resumeBootstrap) angular.resumeBootstrap();
