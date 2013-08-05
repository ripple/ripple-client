module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    basePath: '../',

    files: [
      'build/dist/deps-debug.js',
      'test/lib/angular/angular-mocks.js',
      'config.js',
      'build/dist/ripple-client-desktop-debug.js',
      'test/unit/**/*.js'
    ],

    browsers: ['Chrome'],
    singleRun: false,
    autoWatch: true
  });
};


// basePath = '../';

// files = [
//   JASMINE,
//   JASMINE_ADAPTER,
//   'build/dist/deps-debug.js',
//   'test/lib/angular/angular-mocks.js',
//   'config.js',
//   'build/dist/ripple-client-desktop-debug.js',
//   'test/unit/**/*.js'
// ];

// autoWatch = true;
// singleRun = false;

// browsers = ['Chrome'];

// junitReporter = {
//   outputFile: 'test_out/unit.xml',
//   suite: 'unit'
// };
