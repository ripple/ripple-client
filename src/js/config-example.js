/**
 * Ripple Client Configuration
 *
 * Copy this file to config.js and edit to suit your preferences.
 */
var Options = {
  // Local domain
  //
  // Which domain should ripple-client consider native?
  domain: "ripple.com",

  // Rippled to connect
  server: {
    trace :         true,
    trusted:        true,
    local_signing:  true,

    servers: [
      { host: 's-west.ripple.com', port: 443, secure: true },
      { host: 's-east.ripple.com', port: 443, secure: true }
    ],

    connection_offset: 0
  },

  // DEPRECATED: Blobvault server (old blob protocol)
  //
  // The blobvault URL for the new login protocol is set via authinfo. You can
  // still use this setting for the fallback feature.
  blobvault : 'https://blobvault.ripple.com',

  // If set, login will persist across sessions (page reload). This is mostly
  // intended for developers, be careful about using this in a real setting.
  persistent_auth : false,

  // Number of transactions each page has in balance tab notifications
  transactions_per_page: 50,

  // Configure bridges
  bridge: {
    // Outbound bridges
    out: {
      // Bitcoin outbound bridge
//    'bitcoin': 'localhost:3000'
//    'bitcoin': 'https://www.bitstamp.net/ripple/bridge/out/bitcoin/'
    }
  },

  mixpanel: {
    "token": '',
    "track": true
  },

  zipzap: {
    "requester": "zipzap/request.php"
  },

  activate_link: 'http://ripple.com/client/#/register/activate',
  b2rAddress: 'rhxULAn1xW9T4V2u67FX9pQjSz4Tay2zjZ'
};

// Load client-side overrides
if (store.enabled) {
  var settings = JSON.parse(store.get('ripple_settings') || "{}");

  if (settings.server && settings.server.servers) {
    Options.server.servers = settings.server.servers;
  }

  if (settings.blobvault) {
    // TODO: test if url defined and valid
    Options.blobvault = settings.blobvault.replace("payward.com", "ripple.com");
  }

  if (settings.mixpanel) {
    Options.mixpanel = settings.mixpanel;
  }
}

