exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  framework: 'mocha',
  mochaOpts: {
    timeout: 20000
  },
  specs: ['*.js'],
  capabilities: {
    browserName: 'chrome'
  },
  baseUrl: 'http://local.rippletrade.com/index_debug.html',

  // Credentials of a funded test account
  user: {
    username: '',
    password: '',
    secret: ''
  },

  // OldBlob user credentials for testing the migration
  oldUser: {
    username: '',
    password: '',
    secret: ''
  },

  // gateway test
  gateway : {
    address: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
    name: '~SnapSwap',
    fakeCurrency: '111'
  },
  
  // Ripple address to send xrp to
  counterparty: ''
};
