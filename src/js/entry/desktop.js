var App = require('../client/app').App;
var Id = require('../client/id').Id;
var Network = require('../client/network').Network;
var Model = require('../client/model').Model;
var StatusManager = require('../client/status').StatusManager;
var Angular = require('../client/angular').Angular;
var types = require('../util/types');

Angular.load();

// Load framework
var app    = App.singleton;
var net    = new Network();
var id     = new Id();
var model  = new Model();
var sm     = new StatusManager();
app.setNetwork(net);
app.setId(id);
app.setModel(model);
app.setStatusManager(sm);
var rippleclient = window.rippleclient = app;

app.types = types;

// Some backwards compatibility
if (!Options.blobvault) {
  Options.blobvault = Options.BLOBVAULT_SERVER;
}
