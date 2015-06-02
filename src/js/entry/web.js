var types = require('../util/types'),
    rewriter = require('../util/jsonrewriter');

// Load app modules
require('../controllers/app.controller.js');
require('../controllers/navbar.controller.js');
require('../directives/charts.directive.js');
require('../directives/fields.directive.js');
require('../directives/effects.directive.js');
require('../directives/validators.directive.js');
require('../directives/accountExists.directive.js');
require('../directives/events.directive.js');
require('../directives/formatters.directive.js');
require('../directives/directives.directive.js');
require('../directives/addressPopover.directive.js');
require('../directives/datalinks.directive.js');
require('../directives/errors.directive.js');
require('../directives/marketchart.directive.js');
require('../filters/filters.filter.js');
require('../filters/amountHasIssuer.filter.js');
require('../validators/rpWebsocket.directive.js');
require('../services/globalwrappers.service.js');
require('../services/id.service.js');
require('../services/tracker.service.js');
require('../services/blobRemote.service.js');
require('../services/oldblob.service.js');
require('../services/txqueue.service.js');
require('../services/authflowRemote.service.js');
require('../services/keychain.service.js');
require('../services/network.service.js');
require('../services/books.service.js');
require('../services/popup.service.js');
require('../services/rippletxt.service.js');
require('../services/federation.service.js');
require('../services/domainalias.service.js');
require('../services/history.service.js');
require('../services/notifications.service.js');

require('../services/integration/appManager.service.js');
require('../services/integration/profileManager.service.js');
require('../services/integration/account.service.js');
require('../services/integration/history.service.js');
require('../services/integration/trust.service.js');
require('../services/integration/inboundBridge.service.js');

// Unused services
// require('../services/ledger.service.js');
// require('../services/transactions.service.js');

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
  'ui.sortable',
  'notifications'
];

// Load tabs
var tabdefs = [
  require('../tabs/login.controller.js'),
  require('../tabs/migrate.controller.js'),
  require('../tabs/recover.controller.js'),
  require('../tabs/balance.controller.js'),
  require('../tabs/history.controller.js'),
  require('../tabs/contacts.controller.js'),
  require('../tabs/exchange.controller.js'),
  require('../tabs/account.controller.js'),
  require('../tabs/trust.controller.js'),
  require('../tabs/send.controller.js'),
  require('../tabs/trade.controller.js'),
  require('../tabs/advanced.controller.js'),
  require('../tabs/security.controller.js'),
  require('../tabs/kyc.controller.js'),
  require('../tabs/tx.controller.js'),
  require('../tabs/xrp.controller.js'),
  require('../tabs/debug.controller.js'),
  require('../tabs/btc.controller.js'),
  require('../tabs/withdraw.controller.js'),
  require('../tabs/usd.controller.js'),
  require('../tabs/eur.controller.js'),
  require('../tabs/sgd.controller.js'),
  require('../tabs/cad.controller.js'),
  require('../tabs/gold.controller.js'),
  require('../tabs/tou.controller.js'),
  require('../tabs/privacypolicy.controller.js'),
  require('../tabs/twofa.controller.js'),
  require('../tabs/jpy.controller.js'),
  require('../tabs/mxn.controller.js'),
  require('../tabs/404.controller.js'),
  require('../tabs/brl.controller.js'),
  require('../tabs/settingstrade.controller.js'),
  require('../tabs/settingsgateway.controller.js'),
  require('../tabs/notifications.controller.js'),

  // Hidden tabs
  require('../tabs/apps.controller.js'),
  require('../tabs/su.controller.js')
];

// Language
window.lang = (function(){
  var languages = _.pluck(require('../../../l10n/languages.json').active, 'code');
  var resolveLanguage = function(lang) {
    if (!lang) return null;
    if (languages.indexOf(lang) != -1) return lang;
    if (lang.indexOf("_") != -1) {
      lang = lang.split("_")[0];
      if (languages.indexOf(lang) != -1) return lang;
    }
    return null;
  };
  return resolveLanguage(store.get('ripple_language')) ||
    resolveLanguage(window.navigator.userLanguage || window.navigator.language) ||
    'en';
})();

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
// for unit tests
rippleclient.rewriter = rewriter;

// for unit tests
rippleclient.tabs = {};
_.each(tabs, function(tab) { rippleclient.tabs[tab.tabName] = tab; });

Config.$inject = ['$routeProvider', '$injector'];

function Config ($routeProvider, $injector) {
  // Set up routing for tabs
  _.each(tabs, function (tab) {
    var config = {
      tabName: tab.tabName,
      tabClass: 't-' + tab.tabName,
      pageMode: 'pm-' + tab.pageMode,
      mainMenu: tab.mainMenu,
      templateUrl: 'templates/' + lang + '/tabs/' + tab.tabName + '.html'
    };

    if ('balance' === tab.tabName) {
      $routeProvider.when('/', config);
    }

    $routeProvider.when('/' + tab.tabName, config);

    if (tab.extraRoutes) {
      _.each(tab.extraRoutes, function(route) {
        $.extend({}, config, route.config);
        $routeProvider.when(route.name, config);
      });
    }

    _.each(tab.aliases, function (alias) {
      $routeProvider.when('/' + alias, config);
    });
  });

  // Language switcher
  $routeProvider.when('/lang/:language', {
    redirectTo: function(routeParams, path, search){
      lang = routeParams.language;

      if (!store.disabled) {
        store.set('ripple_language', lang ? lang : '');
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
  $rootScope.lang = lang;
  $('#main').data('$scope', scope);

  // If using the old "amnt" parameter rename it "amount"
  var amnt = $location.search().amnt;
  if (amnt) {
    $location.search("amnt", null);
    $location.search("amount", amnt);
  }

  // put Options to rootScope so it can be used in html templates
  $rootScope.globalOptions = Options;

  // Show loading while waiting for the template load
  $rootScope.$on('$routeChangeStart', function() {
    $rootScope.pageLoading = true;
  });

  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.pageLoading = false;
  });

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
