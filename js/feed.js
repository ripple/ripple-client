var feed = {};

feed.onShowTab = function () {};

feed.clear = function () {
  $('#FeedArea').empty();
};

feed.onLedgerClick = function (ele) {
  if (ele.checked) {
    server.subscribe("ledger_accounts");
  } else {
    server.unsubscribe("ledger_accounts");
  }
};

feed.onTransactionsClick = function (ele) {
  if (ele.checked) {
    server.subscribe("transaction");
  } else {
    server.unsubscribe("transaction");
  }
};

feed.onServerClick = function (ele) {
  if (ele.checked) {
    server.subscribe("server");
  } else {
    server.unsubscribe("server");
  }
};

feed.addTransaction = function (obj) {};