var App = require('../client/app').App;
var TabManager = require('../client/tabmanager').TabManager;
var Id = require('../client/id').Id;
var Network = require('../client/network').Network;

var app = App.singleton;
var net = new Network();
var id = new Id();
var tabs = new TabManager();
app.setNetwork(net);
app.setTabManager(tabs);
app.setId(id);
window.rippleclient = app;

angular.injector(['ng']).invoke(function($rootScope, $compile) {
  var scope = $rootScope.$new();
  app.setAngular(scope, $compile);

  jQuery(function () {
    app.startup();
    window.onhashchange = tabs.handleHashChange.bind(tabs);
  });
});

