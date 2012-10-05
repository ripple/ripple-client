var rpc = {};

rpc.reload = function () {
  rpc.url = "http://" + Options.RPC_SERVER + "/";
}

rpc.url = "http://" + Options.RPC_SERVER + "/";

rpc.displayResult = function (response, success) {
  if (success) {
    if (!ncc.checkError(response)) {
      $('#status').text(JSON.stringify(response));
    }
  } else {
    ncc.error('No response from server. Please check if it is running.');
  }
};

rpc.call = function (request, callback) {
  // console.log("->", request.method, ":", request);
  $.ajax({
    type: 'POST',
    url: rpc.url,
    data: JSON.stringify(request),
    success: function (x) { 
      // console.log("<-", request.method, ":", x);
      callback(x, true);
    },
    error: function (x) {
      // console.log("<-err", request.method, ":", x);
      callback(x, false);
    },
    dataType: "json"
  });
};


rpc.send = function (key, fromAccount, toAccount, amount, currency, optIssuer, callback) {
  var req = { method: "send" },
      nArgs = arguments.length,
      lastArg = arguments[nArgs - 1];
      
  if (lastArg.constructor == Function) {
    callback = lastArg;
    req.params = Array.prototype.slice.call(arguments, 0, nArgs - 1);
  } else {
    callback = function () {};
    req.params = arguments;
  }
  
  rpc.call(req, callback);
};

rpc.server_info = function (callback) {
  var request = {};
  request.method = "server_info";
  request.params = [];
  rpc.call(request, callback);
};

rpc.wallet_propose = function (callback) {
  var request = {};
  request.method = "wallet_propose";
  request.params = [];
  rpc.call(request, callback);
};

rpc.wallet_accounts = function (key, callback) {
  var request = {};
  request.method = "wallet_accounts";
  request.params = [key];
  rpc.call(request, callback);
};

rpc.data_fetch = function (key, callback) {
  if (ncc.admin)
  {
    var request = {};
    request.method = "data_fetch";
    request.params = [key];
    rpc.call(request, callback);
  }
};

rpc.data_store = function (key, value) {
  if (ncc.admin)
  {
    var request = {};
    request.method = "data_store";
    request.params = [key, value];
    rpc.call(request, rpc.displayResult);
  }
};

rpc.data_delete = function (key) {
  if (ncc.admin)
  {
    var request = {};
    request.method = "data_delete";
    request.params = [key];
    rpc.call(request, rpc.displayResult);
  }
};

rpc.account_tx = function (accountID, callback) {
  if (ncc.admin)
  {
    var request = {};
    request.method = "account_tx";
    request.params = [accountID, "0", "999999"];
    rpc.call(request, callback);
  }
};

rpc.connect = function (ip, port) {
  var request = {};
  request.method = "connect";
  request.params = [ip, port];
  rpc.call(request, rpc.displayResult);
};

rpc.unl_add = function (addr, note) {
  var request = {};
  request.method = "unl_add";
  request.params = [addr, note];
  rpc.call(request, rpc.displayResult);
};

rpc.unl_delete = function (addr) {
  var request = {};
  request.method = "unl_delete";
  request.params = [addr];
  rpc.call(request, rpc.displayResult);
};

rpc.peers = function (callback) {
  var request = {};
  request.method = "peers";
  request.params = [];
  rpc.call(request, callback);
};

rpc.stop = function () {
  var request = {};
  request.method = "stop";
  request.params = [];
  rpc.call(request, rpc.displayResult);
};

rpc.ledger = function (callback) {
  var request = {};
  request.method = "ledger";
  request.params = ["lastclosed", "full"];
  rpc.call(request, callback);
};

rpc.unl_list = function (callback) {
  var request = {};
  request.method = "unl_list";
  request.params = [];
  rpc.call(request, callback);
};

rpc.ripple_lines_get = function (accountID, callback) {
  var request = {};
  request.method = "ripple_lines_get";
  request.params = [accountID];
  rpc.call(request, callback);
};

rpc.ripple_line_set = function (key, fromAccountID, toAccountID, amount, currency, callback) {
  var request = {};
  request.method = "ripple_line_set";
  request.params = [key, fromAccountID, toAccountID, amount, currency];
  rpc.call(request, callback);
};

//seed paying_account taker_pays_amount taker_pays_currency taker_pays_issuer taker_gets_amount taker_gets_currency taker_gets_issuer expires [passive]
rpc.offer_create = function (key, accountID, outAmount, outCurrency, outIssuer, inAmount, inCurrency, inIssuer, expires, callback) {
  var request = {};
  request.method = "offer_create";
  request.params = [key, accountID, outAmount, outCurrency, outIssuer, inAmount, inCurrency, inIssuer, expires];
  rpc.call(request, callback);
};

rpc.offer_cancel = function (key, accountID, offerID, callback) {
  var request = {};
  request.method = "offer_cancel";
  request.params = [key, accountID, offerID];
  rpc.call(request, callback);
};
