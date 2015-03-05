var types = require('../util/types');

// Load app modules
require('../controllers/app');
require('../controllers/navbar');
require('../directives/charts');
require('../directives/fields');
require('../directives/effects');
require('../directives/validators');
require('../directives/accountExists.js');
require('../directives/events');
require('../directives/formatters');
require('../directives/directives');
require('../directives/datalinks');
require('../directives/errors');
require('../directives/marketchart');
require('../filters/filters');
require('../filters/amountHasIssuer.js');
require('../validators/rpWebsocket.js');
require('../services/globalwrappers');
require('../services/id');
require('../services/tracker');
require('../services/blobRemote');
require('../services/oldblob');
require('../services/txqueue');
require('../services/authflowRemote');
require('../services/keychain');
require('../services/network');
require('../services/books');
require('../services/popup');
require('../services/rippletxt');
require('../services/federation');
require('../services/domainalias');
require('../services/history');

require('../services/integration/appManager');
require('../services/integration/profileManager');
require('../services/integration/account');
require('../services/integration/history');
require('../services/integration/trust');
require('../services/integration/inboundBridge');

// Unused services
// require('../services/ledger');
// require('../services/transactions');

// Angular module dependencies
var appDependencies = [
  'ngRoute',
  // Controllers
  'app',
  'navbar',
  // Services
  'id',
  'tracker',
  'appManager',
  'history',
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
  'ngMessages',
  // Filters
  'filters',
  'ui.bootstrap',
  'ui.sortable'
];

// Load tabs
var tabdefs = [
  require('../tabs/register'),
  require('../tabs/login'),
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
  require('../tabs/debug'),
  require('../tabs/btc'),
  require('../tabs/withdraw'),
  require('../tabs/usd'),
  require('../tabs/eur'),
  require('../tabs/sgd'),
  require('../tabs/aud'),
  require('../tabs/gold'),
  require('../tabs/tou'),
  require('../tabs/privacypolicy'),
  require('../tabs/twofa'),
  require('../tabs/jpy'),
  require('../tabs/mxn'),
  require('../tabs/nzd'),
  require('../tabs/404'),
  require('../tabs/brl'),
  require('../tabs/settingstrade'),

  // Hidden tabs
  require('../tabs/apps'),
  require('../tabs/su')
];

// Prepare tab modules
var tabs = tabdefs.map(function (Tab) {
  var tab = new Tab();

  if (tab.angular) {
    var module = angular.module(tab.tabName + 'Tab', tab.angularDeps);
    tab.angular(module);
    appDependencies.push(tab.tabName + 'Tab');
  }

  return tab;
});

var app = angular
  .module('rp', appDependencies)
  .config(Config)
  .run(Run);

// Global reference for debugging only (!)
var rippleclient = window.rippleclient = {};
rippleclient.app = app;
rippleclient.types = types;

// Install basic page template
angular.element('body').prepend(require('../../jade/client/index.jade')());

Config.$inject = ['$routeProvider', '$injector'];

function Config ($routeProvider, $injector) {
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

      if ('balance' === tab.tabName) {
        $routeProvider.when('/', config);
      }

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

  $routeProvider.otherwise({redirectTo: '/404'});
}

Run.$inject = ['$rootScope', '$route', '$routeParams', '$location'];

function Run ($rootScope, $route, $routeParams, $location)
{
  $rootScope.productName = 'Ripple Trade';

  // Global reference for debugging only (!)
  if ("object" === typeof rippleclient) {
    rippleclient.$scope = $rootScope;
    rippleclient.version = $rootScope.version =
      angular.element('#version').html();
    if (typeof debug !== "undefined" && debug === true) {
      rippleclient.versionBranch = $rootScope.versionBranch =
        angular.element('#versionbranch').text();
    }
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

  // put Options to rootScope so it can be used in html templates
  $rootScope.globalOptions = Options;

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
}

// Some backwards compatibility
if (!Options.blobvault) {
  Options.blobvault = Options.BLOBVAULT_SERVER;
}

if ("function" === typeof angular.resumeBootstrap) {
  angular.resumeBootstrap();

  angular.resumeBootstrap = function() {
    return false;
  };
}
