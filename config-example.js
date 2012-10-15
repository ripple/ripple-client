var BALANCE_DISPLAY_DIVISOR = 1000000,
    DATA_STORE = 'RPCDataStore',
    DATA_STORE_URL = "https://cointoss.me/datastore.php",
    
    NUM_RECENT_ADDRESSES = 10;

var Options = _.defaults(
  JSON.parse(localStorage.opts || "{}"),
  {
    WS_SERVER : "localhost:51233",
    RPC_SERVER : "localhost:51234",
    BLOBVAULT_SERVER : "localhost:51235",
    
    save : function () {
      var o = _.clone(this);
      delete o.save;
      localStorage.opts = JSON.stringify(o);
    }
  }
);

