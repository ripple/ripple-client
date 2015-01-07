var types = require('../util/types');

// Load app modules
require('../controllers/app');
require('../controllers/navbar');

require('../directives/charts/balancepiechart');
require('../directives/charts/trustlines');

require('../directives/fields/combobox');
require('../directives/fields/datepicker');
require('../directives/fields/uploadbutton');


require('../directives/effects/animate');
require('../directives/effects/slide');
require('../directives/effects/zoom');

require('../directives/validators/amount');
require('../directives/validators/amountpositive');
require('../directives/validators/amountxrplimit');
require('../directives/validators/availablename');
require('../directives/validators/dest');
require('../directives/validators/email');
require('../directives/validators/hostname');
require('../directives/validators/invoiceid');
require('../directives/validators/issuer');
require('../directives/validators/masteraddressexists');
require('../directives/validators/masterkey');
require('../directives/validators/maxdigits');
require('../directives/validators/notme');
require('../directives/validators/portnumber');
require('../directives/validators/restrictcurrencies');
require('../directives/validators/sameinset');
require('../directives/validators/srcdesttag');
require('../directives/validators/strongpassword');
require('../directives/validators/unique');
require('../directives/validators/uniquescope');

require('../directives/events');

require('../directives/formatters/prettyamount');
require('../directives/formatters/prettyamounthighprecision');
require('../directives/formatters/prettyamountdate');
require('../directives/formatters/prettyidentity');
require('../directives/formatters/bindcoloramount');
require('../directives/formatters/currency');
require('../directives/formatters/prettyissuer');

require('../directives/directives/addresspopover');
require('../directives/directives/autofill');
require('../directives/directives/bridgelimit');
require('../directives/directives/confirm');
require('../directives/directives/download');
require('../directives/directives/erroron');
require('../directives/directives/errors');
require('../directives/directives/errorunknown');
require('../directives/directives/errorvalid');
require('../directives/directives/focus');
require('../directives/directives/inlineedit');
require('../directives/directives/nopropogate');
require('../directives/directives/offcanvasmenu');
require('../directives/directives/popover');
require('../directives/directives/popup');
require('../directives/directives/selectel');
require('../directives/directives/snapper');
require('../directives/directives/sortheader');
require('../directives/directives/spanspacing');
require('../directives/directives/spinner');
require('../directives/directives/tooltip');
require('../directives/directives/upload');

require('../directives/datalinks');
require('../directives/errors');
require('../directives/qr');
require('../directives/marketchart');

require('../filters/filters/addressorigin');
require('../filters/filters/amount');
require('../filters/filters/amountadd');
require('../filters/filters/amountratio');
require('../filters/filters/amountsubtract');
require('../filters/filters/contactname');
require('../filters/filters/contactnamefull');
require('../filters/filters/currency');
require('../filters/filters/currencyfull');
require('../filters/filters/currentpair');
require('../filters/filters/filesize');
require('../filters/filters/fromnow');
require('../filters/filters/heavynormalize');
require('../filters/filters/issuer');
require('../filters/filters/mask');
require('../filters/filters/onlycontactname');
require('../filters/filters/range');
require('../filters/filters/ripplename');
require('../filters/filters/sortmyorders');
require('../filters/filters/truncate');
require('../filters/filters/upfirst');
require('../filters/filters/values');

require('../filters/amountHasIssuer.js');
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
require('../services/history');

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
  // Filters
  'filters',
  'ui.bootstrap'
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
  require('../tabs/gold'),
  require('../tabs/tou'),
  require('../tabs/privacypolicy'),
  require('../tabs/twofa'),
  require('../tabs/jpy'),
  require('../tabs/mxn'),
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
    tab.angular(angular.module(tab.tabName + 'Tab', tab.angularDeps));
    appDependencies.push(tab.tabName + 'Tab');
  }

  return tab;
});

var app = angular
  .module('rp', appDependencies)
  .config(Config)
  .run(Run)
  .factory('$exceptionHandler', ExceptionHandler);

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
};

Run.$inject = ['$rootScope', '$injector', '$compile', '$route',
  '$routeParams', '$location', '$document', 'rpId'];

function Run ($rootScope, $injector, $compile, $route, $routeParams, $location, $document, id)
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
};

// Track uncaught exceptions
ExceptionHandler.$inject = ['$injector'];

function ExceptionHandler ($injector) {
  return function(exception, cause) {
    var $log = $injector.get('$log');
    $log.error.apply($log,arguments);
    $injector.get('rpTracker').trackError('Uncaught Exception', exception);
  };
};

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
