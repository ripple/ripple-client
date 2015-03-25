/**
 * Ripple Client Configuration
 *
 * Copy this file to config.js and edit to suit your preferences.
 */
var Options = {
  // Local domain
  //
  // Which domain should ripple-client consider native?
  domain: 'localhost:9001',

  // Rippled to connect
  server: {
    trace: false,
    trusted: true,
    local_signing: true,

    servers: [
      { host: 'localhost', port: 9002, secure: false }
    ],

    connection_offset: 0
  },

  // DEPRECATED: Blobvault server (old blob protocol)
  //
  // The blobvault URL for the new login protocol is set via authinfo. You can
  // still use this setting for the fallback feature.
  blobvault: 'https://blobvault.ripple.com',

  // If set, login will persist across sessions (page reload). This is mostly
  // intended for developers, be careful about using this in a real setting.
  persistent_auth: false,

  historyApi: 'https://history.ripple.com:7443/v1/',

  // Number of transactions each page has in balance tab notifications
  transactions_per_page: 50,

  // Configure bridges
  bridge: {
    // Outbound bridges
    out: {
      // Bitcoin outbound bridge
      // bitcoin: 'snapswap.us'
      'bitcoin': 'btc2ripple.com'
    }
  },

  mixpanel: {
    'token': '',
    // Don't track events by default
    'track': false
  },

  // production
  // activate_link: 'http://rippletrade.com/#/register/activate',
  // staging
  activate_link: 'http://staging.ripple.com/client/#/register/activate',

  b2rAddress: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
  snapswapApi: 'https://snapswap.us/api/v1',

  // Number of ledgers ahead of the current ledger index where a tx is valid
  tx_last_ledger: 3,

  // Set max transaction fee for network in drops of XRP
  max_tx_network_fee: 200000,

  // Set max number of rows for orderbook
  orderbook_max_rows: 20,

  // Show transaction confirmation page
  confirmation: {
    send: true,
    exchange: true,
    trade: true
  },

  // Show advanced parameters in the trust/gateway page
  advanced_feature_switch: false,

  // Default gateway max trust amount under 'simplfied' view ie when advanced_feature_switch is false in trust/gateway page
  gateway_max_limit: 1000000000,

  ticker: {
    markets: [
      {
        base: {currency: "XRP"},
        counter: {currency: "USD", issuer: "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"}
      },
      {
        base: {currency: "XRP"},
        counter: {currency: "USD", issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"}
      },
      {
        base: {currency: "BTC", issuer: "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"},
        counter: {currency: "XRP"}
      },
      {
        base: {currency: "BTC", issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"},
        counter: {currency: "XRP"}
      },
      {
        base: {currency: "XRP"},
        counter: {currency: "JPY", issuer: "rMAz5ZnK73nyNUL4foAvaxdreczCkG3vA6"}
      },
      {
        base: {currency: "XRP"},
        counter: {currency: "CNY", issuer: "rnuF96W4SZoCJmbHYBFoJZpR8eCaxNvekK"}
      },
      {
        base: {currency: "XRP"},
        counter: {currency: "KRW", issuer: "rUkMKjQitpgAM5WTGk79xpjT38DEJY283d"}
      },
      {
        base: {currency: "XRP"},
        counter: {currency: "EUR", issuer: "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q"}
      }
    ]
  }
};

// Load client-side overrides
if (store.enabled) {
  var settings = JSON.parse(store.get('ripple_settings') || '{}');

  if (settings.server && settings.server.servers) {
    Options.server.servers = settings.server.servers;
  }

  if (settings.bridge) {
    Options.bridge.out.bitcoin = settings.bridge.out.bitcoin.replace('https://www.bitstamp.net/ripple/bridge/out/bitcoin/', 'snapswap.us');
  }

  if (settings.blobvault) {
    // TODO: test if url defined and valid
    Options.blobvault = settings.blobvault.replace('payward.com', 'ripple.com');
  }

  if (settings.mixpanel) {
    Options.mixpanel = settings.mixpanel;
  }

  if (settings.max_tx_network_fee) {
    Options.max_tx_network_fee = settings.max_tx_network_fee;
  }

  Options.server.servers = Options.server.servers.map(function (server) {
    server.host = server.host.replace(/s_(west|east)/, 's-$1');
    return server;
  });
}
