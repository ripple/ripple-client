/*
We want to be able to inject mocks into tests with dependencies on these globals
*/

// deps/js/store.js
angular.module('app.globals', []).constant('store', store);
// config.js
angular.module('app.globals', []).constant('Options', Options);
