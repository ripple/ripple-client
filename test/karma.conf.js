module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    basePath: '../',

    files: [
      'build/dist/js/vendor-*.js',
      'deps/js/angular-mocks/angular-mocks.js',
      'config.js',
      'build/dist/js/app.js',
      'test/unit/**/*.js'
    ],

    browsers: ['Chrome', 'Firefox'],
    singleRun: false,
    autoWatch: true,

    // coverage
    // reporters: ['progress', 'coverage'],
    reporters: ['progress'],

    preprocessors: {
      'src/js/**/*.js': ['coverage']
    },

    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage/'
    }
  });
};
