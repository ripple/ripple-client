var orderBookScreen = {};

orderBookScreen.init = function () {
  var buyCurr = 'USD',
      sellCurr = 'XNS';
  
  $("#OrderBookBuyCurrency").combobox({
    data: ncc.allCurrencyOptions,
    selected: buyCurr,
    onselect: function () {
      buyCurr = this.value;
      if (buyCurr != sellCurr) {
        orderBookScreen.updateRowsShown();
      }
    }
  });
  
  $("#OrderBookSellCurrency").combobox({
    data: ncc.allCurrencyOptions,
    selected: sellCurr,
    onselect: function () {
      sellCurr = this.value;
      if (buyCurr != sellCurr) {
        orderBookScreen.updateRowsShown();
      }
    }
  });
};

orderBookScreen.ledgerResponse = function (res, noErrors) {
  if (noErrors && res.ledger && res.ledger.accountState) {
    orderBookScreen.addLedger(res.ledger);
  }
};

orderBookScreen.addLedger = function(ledger) {
  var accounts = ledger.accountState,
      offers = [],
      i;
  
  $('#SellingTable').empty();
  $('#BuyingTable').empty();
  
  for(i = 0; i < accounts.length; i++) {
    if (accounts[i].LedgerEntryType == "Offer") {
      offers.push(new orderBookScreen.Offer(accounts[i]));
    }
  }
  
  offers.sort(function (x, y) { return y.price - x.price; });
  
  for (i=0; i < offers.length; i++) {
    var rows = orderBookScreen.makeRows(offers[i]);
    $('#SellingTable').append(rows[0]);
    $('#BuyingTable').prepend(rows[1]);
  }
  
  orderBookScreen.updateRowsShown();
};

orderBookScreen.makeRows = function (offer) {
  return ['<tr class="offer' + offer.TakerPaysCurr + 'for' + offer.TakerGetsCurr + '">'+
            '<td>' + offer.price + '</td>' +
            '<td class="amount">' + offer.TakerGetsValue + '</td>' +
            '<td class="sum"></td>' +
            '<td>' + offer.TakerPaysIssuer + '</td>' +
            '<td>' + offer.TakerGetsIssuer + '</td>' +
          '</tr>',
          
          '<tr class="offer' + offer.TakerGetsCurr + 'for' + offer.TakerPaysCurr + '">'+
            '<td>' + (1 / offer.price) + '</td>' +
            '<td class="amount">' + offer.TakerPaysValue + '</td>' +
            '<td class="sum"></td>' +
            '<td>' + offer.TakerGetsIssuer + '</td>' +
            '<td>' + offer.TakerPaysIssuer + '</td>' +
          '</tr>'];
};

orderBookScreen.updateRowsShown = function () {
  var buyCurr = $("#OrderBookBuyCurrency").val(),
      sellCurr = $("#OrderBookSellCurrency").val();
  
  $('#SellingTable tr, #BuyingTable tr').hide();
  $('#SellingTable tr.offer' + sellCurr + 'for' + buyCurr).show();
  $('#BuyingTable tr.offer' + sellCurr + 'for' + buyCurr).show();

  var sum = 0;
  $('#BuyingTable tr:visible').each(function () {
    var row = $(this);
    sum += Number(row.find(".amount").text());
    row.find(".sum").text(sum);
  });
  
  sum = 0;
  var sellingRows = $('#SellingTable tr:visible');
  for (var i = sellingRows.length - 1; i >= 0; i--) {
    var row = $(sellingRows[i]);
    sum += Number(row.find(".amount").text());
    row.find(".sum").text(sum);
  }
  
  $('#OrderBookAsksLegend').text("Selling " + buyCurr + "/" + sellCurr + " (asks)");
  $('#OrderBookBidsLegend').text("Buying " + buyCurr + "/" + sellCurr + " (bids)");
}

orderBookScreen.Offer = function (offerJSON) {
  if (offerJSON.LedgerEntryType != "Offer") {
    throw "Not an offer!";
  }
  
  this._offer = offerJSON;
  
  this.TakerGetsIssuer = offerJSON.TakerGets.issuer || "";
  this.TakerPaysIssuer = offerJSON.TakerPays.issuer || "";
  
  this.TakerGetsCurr = offerJSON.TakerGets.currency || "XNS";
  this.TakerPaysCurr = offerJSON.TakerPays.currency || "XNS";
  
  this.TakerGetsValue = this.TakerGetsCurr == "XNS" ? Number(offerJSON.TakerGets) / BALANCE_DISPLAY_DIVISOR : Number(offerJSON.TakerGets.value);
  this.TakerPaysValue = this.TakerPaysCurr == "XNS" ? Number(offerJSON.TakerPays) / BALANCE_DISPLAY_DIVISOR : Number(offerJSON.TakerPays.value);
  
  this.price = this.TakerPaysValue / this.TakerGetsValue;
};
