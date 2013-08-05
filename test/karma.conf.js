basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'build/dist/deps-debug.js',
  'test/lib/angular/angular-mocks.js',
  'config.js',
  'build/dist/ripple-client-desktop-debug.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
