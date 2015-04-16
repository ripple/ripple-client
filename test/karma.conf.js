module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    basePath: '../',

    files: [
      'build/dist/js/vendor-*.js',
      'deps/js/angular-mocks/angular-mocks.js',
      'config.js',
      'build/dist/js/app.js',
      'test/unit/**/*.js',
      'build/dist/templates/**/*.html'
    ],

    browsers: ['Chrome', 'Firefox'],
    singleRun: false,
    autoWatch: true,

    // coverage
    // reporters: ['progress', 'coverage'],
    reporters: ['progress'],

    preprocessors: {
      'src/js/**/*.js': ['coverage'],
      'build/dist/templates/**/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
      // If your build process changes the path to your templates,
      // use stripPrefix and prependPrefix to adjust it.
      stripPrefix: 'build/dist/',
      // prependPrefix: 'build/dist/',

      // the name of the Angular module to create
      moduleName: 'my.templates'
    },

    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage/'
    }
  });
};
