var feed = {};

feed.init = function (remote) {
  remote.on('ledger_closed', feed.onLedgerClose);
  $('#FeedLedgerCheckbox').change(feed.onLedgerClick);
  $('#FeedTransactionsCheckbox').change(feed.onTransactionsClick);
  $('#FeedServerCheckbox').change(feed.onServerClick);
  $('#FeedClearButton').click(feed.clear);
};

feed.onShowTab = function () {};

feed.clear = function () {
  $('#FeedArea').empty();
};

feed.displayLedgerEvents = false;
feed.displayServerEvents = false;

feed.onLedgerClick = function (ele) {
  feed.displayLedgerEvents = !!ele.checked;
};

feed.onLedgerClose = function (hash, index) {
  if (!feed.displayLedgerEvents) return;

  str = '<div class="ledgerFeedMsg">Accepted Ledger <strong>' + ncc.escape(index) +
    '</strong> hash:' + ncc.escape(hash) + '</div>';

  $('#FeedArea').prepend(str);
};

feed.onTransactionsClick = function (ele) {
  if (ele.checked) {
    remote.request_subscribe('transactions').request();
  } else {
    remote.request_unsubscribe('transactions').request();
  }
};

feed.onServerClick = function (ele) {
  if (ele.checked) {
    //server.subscribe("server");
  } else {
    //server.unsubscribe("server");
  }
};

feed.addTransaction = function (obj) {};

exports.FeedPage = feed;
