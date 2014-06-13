module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    basePath: '../',

    files: [
      'build/dist/deps-debug.js',
      'deps/js/angular-mocks/angular-mocks.js',
      'src/js/config.js',
      'build/dist/web/ripple-client-debug.js',
      'test/unit/**/*.js'
    ],

    browsers: ['Chrome', 'Firefox'],
    singleRun: false,
    autoWatch: true
  });
};
