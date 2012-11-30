/**
 * Ripple Client Configuration
 *
 * Copy this file to config.js and edit to suit your preferences.
 */
var Options = {
  server: {
    "trusted" : true,
    "websocket_ip" : "127.0.0.1",
    "websocket_port" : 5006,
    "websocket_ssl" : false
  },
  blobvault : "54.243.129.146:80",

  // If set, login will persist across sessions (page reload). This is mostly
  // intended for developers, be careful about using this in a real setting.
  persistent_auth : false
};

// Load client-side overrides
if (store.enabled) {
  $.extend(true, Options, JSON.parse(store.get('ripple_settings') || "{}"));
}

