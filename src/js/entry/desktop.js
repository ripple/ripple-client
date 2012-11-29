var App = require('../client/app').App;
var TabManager = require('../client/tabmanager').TabManager;
var Id = require('../client/id').Id;
var Network = require('../client/network').Network;
var Model = require('../client/model').Model;
var StatusManager = require('../client/status').StatusManager;
var Angular = require('../client/angular').Angular;

Angular.load();

// Load framework
var app    = App.singleton;
var net    = new Network();
var id     = new Id();
var tabs   = new TabManager();
var model  = new Model();
var sm     = new StatusManager();
app.setNetwork(net);
app.setTabManager(tabs);
app.setId(id);
app.setModel(model);
app.setStatusManager(sm);
var rippleclient = window.rippleclient = app;

angular.injector(['ng', 'filters']).invoke(['$rootScope', '$compile', function($rootScope, $compile) {
  var scope = $rootScope.$new();
  app.setAngular(scope, $compile);
  model.init();
  $('#main').data('$scope', scope);

  jQuery(function () {
    app.startup();
    window.onhashchange = tabs.handleHashChange.bind(tabs);
  });
}]);

