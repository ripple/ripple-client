var server = {};
server.socket = null;

// escape a string from the server so it is safe to stick in jquery's .html()
server.escape = function (str) {
  if (str && str.replace)
    return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return str;
}

server.handleMsg = function (msg) {
  var obj = jQuery.parseJSON(msg.data),
      str = '',
      msgType = 'transaction' in obj ? obj.type + '-' + obj.transaction.TransactionType : obj.type;
  
  (obj.error ? ncc.status.error : ncc.status.info)("Got WS message: " + (obj.result || '') + ' ' + msgType, obj);
  
  if (obj) {
    if (obj.type == "account") {
      if (obj.engine_result == "tesSUCCESS") {
        var tx = _.extend(Object.create(obj), obj.transaction);
        if (tx.TransactionType) {
          ncc.trigger('account-' + tx.TransactionType, tx);
        }
      }
    } else if (obj.type == "transaction") {
      var amount = ncc.displayAmount(server.escape(obj.transaction.Amount));
      str = '<div class="transFeedMsg">' +
              server.escape(obj.transaction.Account) + ' sent ' + amount +
              'XNS to ' + server.escape(obj.transaction.Destination) +
            '</div>';
    } else if (obj.type == "ledgerClosed") {
      str = '<div class="ledgerFeedMsg">Accepted Ledger <strong>' + server.escape(obj.ledger_index) +
              '</strong> hash:' + server.escape(obj.ledger_hash) +
            '</div>';
    } else if (obj.type == "response") {
      if (obj.result == "error") {
        str = '<div class="errorFeedMsg">Error Listening ' + server.escape(obj.error) + '</div>';
      } else {
        str = (obj.id == 1) ? '<div class="stopFeedMsg">Stop Listening</div>' 
                            : '<div class="startFeedMsg">Start Listening</div>';
      }
    } else if (obj.type == "rpc_response") {
      rpc.handleResponse(obj);
    } else {
      str = '<div class="unknownFeedMsg">Unknown Msg: ' + server.escape(msg.data) + '</div>';
    }
  } else {
    str = '<div class="errorFeedMsg">Error: ' + server.escape(msg.data) + '</div>';
  }
  
  $('#FeedArea').prepend(str);
};

server.send = function (obj) {
  server.socket.send(JSON.stringify(obj));
  ncc.status.info("Sent WS msg: " + obj.command + ' ' + (obj.id || ''), obj);
};

server.connect = function () {
  if (!Options.WS_SERVER) return;
  
  try {
    server.socket = new WebSocket("ws://" + Options.WS_SERVER + "/");
    server.socket.onopen = function () { ncc.status.info("connected to websocket");  }
    server.socket.onmessage = server.handleMsg;
    server.socket.onclose = function () { ncc.status.error("disconnected from websocket");  }
  } catch (exception) {
    ncc.status.error('Error: ' + exception);
  }
}

server.subscribe = function (streamName) {
  server.send({'command': 'subscribe', 'streams': [streamName]});
}

server.unsubscribe = function (streamName) {
  server.send({'command': 'unsubscribe', 'streams': [streamName]});
}

server.accountSubscribe = function (accountID) {
  if (accountID) {
    server.send({'command': 'subscribe', 'accounts': [accountID]});
  }
}
