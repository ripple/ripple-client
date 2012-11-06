var rpc = {};

rpc.displayResult = function () {};

rpc.unique = -1;

rpc.reqs = [];

rpc.call = function (req, callback) {
  var ws_rpc = {};
  ws_rpc.command = 'rpc';
  ws_rpc.rpc_command = req.method;
  ws_rpc.params = req.params;
  ws_rpc.id = ++rpc.unique;
  server.send(ws_rpc);

  if ("function" === typeof callback) {
    req.callback = callback;
  }

  rpc.reqs[rpc.unique] = req;
};

rpc.handleResponse = function (res) {
  var err = res.error_message || res.error || res.error_code;

  if ("undefined" === typeof res.id) {
    ncc.status.error("RPC error: Untargeted response received");
    return;
  }

  if ("undefined" === typeof rpc.reqs[res.id]) {
    ncc.status.error("RPC error: Unexpected response for ID " + res.id);
    return;
  }

  var req = rpc.reqs[res.id];

  if (err) {
    ncc.status.error(req.method + ': ' + err, { response: res, request: req });
  } else {
    ncc.status.info(
      "RPC call to '" + req.method + "' command successful ",
      { response: res, request: req }
    );
  }

  if ("function" === typeof req.callback) {
    req.callback(res, !err);
  }
};

// key tx callback
rpc.send = function (key, tx, callback) {
  var request = {
    method: "submit",
    params: [key, tx]
  };

  rpc.call(request, callback);
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

rpc.tx_history = function (startIndex, callback) {
  var request = {};
  request.method = "tx_history";
  request.params = [startIndex];
  rpc.call(request, callback);
};
