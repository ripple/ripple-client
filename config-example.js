/**
 * Ripple Client Configuration
 *
 * Copy this file to config.js and edit to suit your preferences.
 */
var Options = {
  server: {
    trace :         true,
    trusted:        true,
    local_signing:  true,

    servers: [
      { host: 's_west.ripple.com', port: 443, secure: true },
      { host: 's_east.ripple.com', port: 443, secure: true }
    ],

    connection_offset: 0
  },

  blobvault : 'https://blobvault.payward.com',

  // If set, login will persist across sessions (page reload). This is mostly
  // intended for developers, be careful about using this in a real setting.
  persistent_auth : false,

  // Number of transactions each page has in balance tab notifications
  transactions_per_page: 50,

  // Configure bridges
  bridge: {
    out: {
//    'bitcoin': 'localhost:3000'
//    'bitcoin': 'https://www.bitstamp.net/ripple/bridge/out/bitcoin/'
    }
  },

  mixpanel: {
    "token": '',
    // Don't track events by default
    "track": false
  }
};

// Load client-side overrides
if (store.enabled) {
  $.extend(Options, JSON.parse(store.get('ripple_settings') || '{}'));
}

