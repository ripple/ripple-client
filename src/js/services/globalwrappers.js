var globals = angular.module('app.globals', []);

/*
We want to be able to inject mocks into tests with dependencies on these globals
*/

// deps/js/store.js
globals.constant('store', store);
// config.js
globals.constant('Options', Options);
