/**
 * LEDGER
 *
 * The ledger service is used to provide information that requires watching the
 * entire ledger.
 *
 * This obviously won't scale, but it'll do long enough for us (or somebody
 * else) to come up with something better.
 */

var module = angular.module('ledger', ['network', 'transactions']);

module.factory('rpLedger', ['$q', '$rootScope', 'rpNetwork', 'rpTransactions',
                            function($q, $rootScope, net, transactions)
{

  var offerPromise = $q.defer();
  var tickerPromise = $q.defer();
  var requested = false;

  var ledger = {
    offers: offerPromise.promise,
    tickers: tickerPromise.promise,
    getOrders: getOrders
  };

  function filterOrder(buyCurrency, sellCurrency, buyIssuer, sellIssuer,
                       pays, gets) {
    if (buyCurrency !== gets.currency || sellCurrency !== pays.currency) {
      return false;
    }

    if (buyCurrency !== 'XRP' && buyIssuer && gets.issuer !== buyIssuer) {
      return false;
    }

    if (sellCurrency !== 'XRP' && sellIssuer && pays.issuer !== sellIssuer) {
      return false;
    }

    return true;
  }

  function getOrders(buyCurrency, sellCurrency, buyIssuer, sellIssuer) {
    var obj = {
      asks: [],
      bids: []
    };

    if (!Array.isArray(ledger.offers)) return obj;

    ledger.offers.forEach(function (node) {
      var gets = rewriteAmount(node.TakerGets);
      var pays = rewriteAmount(node.TakerPays);

      if (filterOrder(buyCurrency, sellCurrency, buyIssuer, sellIssuer, pays, gets)) {
        obj.asks.push({i: gets, o: pays});

        // A bid can't also be an ask
        return;
      }

      if (filterOrder(buyCurrency, sellCurrency, buyIssuer, sellIssuer, gets, pays)) {
        obj.bids.push({i: pays, o: gets});
      }
    });

    obj.asks.sort(function (a, b) {
      var aRatio = a.o.amount.ratio_human(a.i.amount);
      var bRatio = b.o.amount.ratio_human(b.i.amount);
      return aRatio.compareTo(bRatio);
    });

    obj.bids.sort(function (a, b) {
      var aRatio = a.o.amount.ratio_human(a.i.amount);
      var bRatio = b.o.amount.ratio_human(b.i.amount);
      return bRatio.compareTo(aRatio);
    });

    fillSum(obj.asks, 'i');
    fillSum(obj.bids, 'i');

    return obj;
  }

  function rewriteAmount(amountJson) {
    var amount = ripple.Amount.from_json(amountJson);
    return {
      amount: amount,
      // Pretty dirty hack, but to_text for native values gives 1m * value...
      // In the future we will likely remove this field altogether (and use
      // Amount class math instead), so it's ok.
      num: +amount.to_human({group_sep: false}),
      currency: amount.currency().to_json(),
      issuer: amount.issuer().to_json()
    };
  }

  /**
   * Fill out the sum field in the bid or ask orders array.
   */
  function fillSum(array, field) {
    var sum = null;
    for (var i = 0, l = array.length; i<l; i++) {
      if (sum === null) {
        sum = array[i][field].amount;
      } else {
        sum = sum.add(array[i][field].amount);
      }
      array[i].sum = sum;
    }
  }

  if(net.connected) {
    doRequest();
  }

  net.on('connected', function(){
    doRequest();
  });

  function doRequest()
  {
    if (requested) return;

    net.remote.request_ledger("ledger_closed", "full")
        .on('success', handleLedger)
        .request();

    transactions.addListener(handleTransaction);

    requested = true;
  }

  function handleTransaction(msg)
  {
    // XXX: Update the ledger state using this transaction's metadata
  }

  function handleLedger(e)
  {
    $rootScope.$apply(function(){
      var offers = e.ledger.accountState.filter(function (node) {
        return node.LedgerEntryType === "Offer";
      });

      offerPromise.resolve(offers);
      ledger.offers = offers;
    });
  }

  return ledger;
}]);
