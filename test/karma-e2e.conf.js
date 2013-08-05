module.exports = function(config) {
  config.set({
    frameworks: ['ng-scenario'],
    basePath: '../',

    files: [
     'test/e2e/**/*.js'
    ],

    proxies: {
      '/': 'http://localhost:8000'
    },
    urlRoot: '/e2e/',

    browsers: ['Chrome'],
    singleRun: false,
    autoWatch: true,
  });
};