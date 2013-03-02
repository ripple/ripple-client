basePath = '../';

files = [
  ANGULAR_SCENARIO,
  ANGULAR_SCENARIO_ADAPTER,
  {pattern: 'index_debug.html', included: false},
  {pattern: 'build/css/*.css', included: false},
  {pattern: 'build/dist/*.js', included: false},
  {pattern: '*.js', included: false, watch: false},
  {pattern: 'fonts/*', included: false, watch: false},
  {pattern: 'deps/js/modernizr-2.5.3.min.js', included: false, watch: false},
  {pattern: 'img/*', included: false, watch: false},
  'test/e2e/**/*.js'
];

autoWatch = false;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/e2e.xml',
  suite: 'e2e'
};
