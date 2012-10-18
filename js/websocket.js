
// handle updates from the server

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
      str = '';
  
  ncc.status("WS message: " + obj.engine_result_message, obj);
  console.log("WS message: ", msg.data);
  
  if (obj && obj.engine_result == "tesSUCCESS") {
    if (obj.type == "account") {
      var tx = _.extend(Object.create(obj.transaction), obj);
      ncc.trigger('transaction', tx)
      HistoryPage.addTransaction(tx, true);
    } else if (obj.type == "transaction") {
      var amount = ncc.displayAmount(server.escape(obj.transaction.Amount));
      str = '<div class="transFeedMsg">' + server.escape(obj.transaction.Account) + ' sent ' + amount + 'NC to ' + server.escape(obj.transaction.Destination) + '</div>';
    } else if (obj.type == "ledgerClosed") {
      str = '<div class="ledgerFeedMsg">Accepted Ledger <strong>' + server.escape(obj.ledger_closed_index) + '</strong> hash:' + server.escape(obj.ledger_closed) + '</div>';
    } else if (obj.type == "response") {
      if (obj.result == "error") {
        str = '<div class="errorFeedMsg">Error Listening ' + server.escape(obj.error) + '</div>';
      } else {
        str = (obj.id == 1) ? '<div class="stopFeedMsg">Stop Listening</div>' 
                            : '<div class="startFeedMsg">Start Listening</div>';
      }
    } else {
      str = '<div class="unknownFeedMsg">Unknown Msg: ' + server.escape(msg.data) + '</div>';
    }
  } else {
    str = '<div class="errorFeedMsg">Error: ' + server.escape(msg.data) + '</div>';
  }
  
  $('#FeedArea').prepend(str);
};

server.connect = function () {
  if (!Options.WS_SERVER) return;
  
  try {
    server.socket = new WebSocket("ws://" + Options.WS_SERVER + "/");
    
    server.socket.onopen = function () { ncc.status("connected to websocket");  }
    server.socket.onmessage = server.handleMsg;
    server.socket.onclose = function () { ncc.error("Disconnected from websocket");  }
  } catch (exception) {
    ncc.error('Error: ' + exception);
  }
}

server.subscribe = function (streamName)
{
  server.socket.send('{ "command" : "' + streamName + '_subscribe" }');
}

server.unsubscribe = function (streamName)
{
  server.socket.send('{ "command" : "' + streamName + '_unsubscribe", "id" : 1 }');
}

server.accountSubscribe = function (accountID)
{
  if (accountID)
    server.socket.send('{ "command" :  "account_transaction_subscribe", "accounts" : ["' + accountID + '"] }');
}
