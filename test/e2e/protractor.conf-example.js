exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['spec.js'],
  capabilities: {
    browserName: 'chrome'
  },
  baseUrl: 'http://local.rippletrade.com/index_debug.html',

  // Credentials of a funded test account
  user: {
    username: '',
    password: ''
  },

  // OldBlob user credentials for testing the migration
  oldUser: {
    username: '',
    password: ''
  },

  // Ripple address to send xrp to
  counterparty: ''
};