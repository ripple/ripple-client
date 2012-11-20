var BALANCE_DISPLAY_DIVISOR = 1000000,

    NUM_RECENT_ADDRESSES = 10;

var Options = _.defaults(
  JSON.parse(localStorage.opts || "{}"),
  {
    server: {
      "trusted" : true,
      "websocket_ip" : "127.0.0.1",
      "websocket_port" : 5006,
      "websocket_ssl" : false
    },
    BLOBVAULT_SERVER : "localhost:51235",

    save : function () {
      var o = _.clone(this);
      delete o.save;
      localStorage.opts = JSON.stringify(o);
    }
  }
);

