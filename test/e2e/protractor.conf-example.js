exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['spec.js'],
  capabilities: {
    browserName: 'firefox'
  },
  baseUrl: 'http://local.rippletrade.com/index_debug.html',

  username: '',
  password: ''
};