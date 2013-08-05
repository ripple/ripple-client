basePath =  '../';

files = [
  ANGULAR_SCENARIO,
  ANGULAR_SCENARIO_ADAPTER,
  // {pattern: 'index_debug.html', included: false},
  // {pattern: 'build/css/*.css', included: false},
  // {pattern: 'build/dist/*.js', included: false},
  // {pattern: '*.js', included: false, watch: false},
  // // {pattern: 'test/e2e/scenarios.js', included: false, watch: true},

  // {pattern: 'fonts/*', included: false, watch: false},
  // {pattern: 'deps/js/modernizr-2.5.3.min.js', included: false, watch: false},
  // {pattern: 'img/*', included: false, watch: false},
  'test/e2e/**/*.js'
];

singleRun = false;
autoWatch = true;

proxies = {
  '/': 'http://localhost:8000/'
};

urlRoot = '/tests';

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/e2e.xml',
  suite: 'e2e'
};
