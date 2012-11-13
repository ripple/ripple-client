var TradePage = (function () {
  var sellCurr, buyCurr,    // private vars
      outAmount, outIssuer,
      inAmount, inIssuer,
      price,
      
      sellCurrElem, buyCurreElem, // form elements
      amountElem, priceElem,
      buttonElem,
      
      openOrderTable;

  var TradePage = {};
      
  TradePage.init = function () {
    $("#t-trade input").on('keydown', function (e) {
      if (e.which == 13 && !buttonElem.attr('disabled') && !$(this).widget) {
        buttonElem.click();
      }
    });
    
    sellCurrElem = $("#TradePageSellCurr").combobox({
      data: ncc.allCurrencyOptions,
      strict: true,
      selected: 'USD',
      onchange: onFieldsUpdated
    }).data('combobox');
  
    buyCurreElem = $("#TradePageBuyCurr").combobox({
      data: ncc.allCurrencyOptions,
      strict: true,
      selected: 'XNS',
      onchange: onFieldsUpdated
    }).data('combobox');
  
    amountElem = $('#TradePageAmount').on('input', onFieldsUpdated);
    priceElem = $('#TradePagePrice').on('input', onFieldsUpdated);
    buttonElem = $("#TradePageButton");
    openOrderTable = $("#OpenOrderTable");

    $('#TradePageButton').click(TradePage.placeOrder);
  };
  
  function onFieldsUpdated() {
    sellCurr = sellCurrElem.value();
    buyCurr = buyCurreElem.value();
    
    outAmount = amountElem.val();
    price = priceElem.val();
    inAmount = outAmount * price;
    
    if (!(sellCurr && buyCurr && inAmount)) {
      buttonElem.attr('disabled', true);
      TradePage.status.clear();
      return;
    }
    
    var outIssuer;
    if (sellCurr == 'XNS') {
      outIssuer = '';
      outAmount *= BALANCE_DISPLAY_DIVISOR;
    } else {
      outIssuer = ncc.accountID;
    }

    var inRoute;
    if (buyCurr == 'XNS') { 
      inAmount *= BALANCE_DISPLAY_DIVISOR;
      inRoute = { 'max': inAmount + 10, 'accountID': '' };
    } else {
      // need to discover the inIssuer
      inRoute = RipplePage.findBestRouteIn(buyCurr);
    }
    
    inIssuer = inRoute.accountID;
    
    if (sellCurr == buyCurr) {
      TradePage.status.error("Sell Currency cannot equal Buy Currency");
      return;
    }
    
    if (inRoute.max >= inAmount) {
      TradePage.status.info(
        // You are wanting to buy 10 USD for 1000 XNS (price .001)
        "You are wanting to buy " +
        (buyCurr == 'XNS' ? inAmount / BALANCE_DISPLAY_DIVISOR : inAmount) + ' ' + buyCurr + 
        " for " + 
        (sellCurr == 'XNS' ? outAmount / BALANCE_DISPLAY_DIVISOR : outAmount) + ' ' + sellCurr + 
        " (priced " + price + " each)"
      );
    } else {
      TradePage.status.error("Increase your trust network for " + buyCurr + " IOUs first.");
    }
  }
  
  TradePage.onShowTab = function () {
    onFieldsUpdated();

    remote.request_ledger(["lastclosed", "full"])
      .on('success', TradePage.onLedgerResponse)
      .request();
  };
  
  TradePage.placeOrder = function () {
    var takerPays = "" + inAmount + "/" + buyCurr + "/" + inIssuer;
    var takerGets = "" + outAmount + "/" + sellCurr + "/" + outIssuer;
    remote.transaction()
      .offer_create(ncc.accountID,
                    takerPays,
                    takerGets,
                    '0')
      .on('success', TradePage.onOfferCreateResponse)
      .submit()
    ;
  }
  
  TradePage.onOfferCreateResponse = function (res, noErrors) {
    if (noErrors) {
      sellCurrElem.value('USD');
      buyCurreElem.value('XNS');
      amountElem.val('');
      priceElem.val('');
      onFieldsUpdated();
    }
  };
  
  TradePage.status = {
    info: function (s) {
      if (s) {
        $("#TradePageStatus div.info").show().text(s);
        this.error(null);
        buttonElem.attr('disabled', false);
      } else {
        $("#TradePageStatus div.info").hide();
      }
    },
    
    error: function (e) {
      if (e) {
        $("#TradePageStatus div.error").show().text(e);
        this.info(null);
        buttonElem.attr('disabled', true);
      } else {
        $("#TradePageStatus div.error").hide();
      }
    },
    
    clear: function () {
      $("#TradePageStatus div").hide();
    }
  };
  
  function createOrderRow(a) {
    var takerGets = Amount(a.TakerGets),
        takerPays = Amount(a.TakerPays);
    
    return ('<tr data-sequence="' + a.Sequence + '">' +
              '<td>' + '' + '</td>' +
              '<td>' + takerGets.currency + '/' + takerPays.currency + '</td>' +
              '<td>' + (takerPays.value / takerGets.value) + '</td>' +
              '<td>' + takerGets.value + '</td>' +
              '<td>' + (a.status || 'closed') + '</td>' +
              '<td>' +
                '<button onclick="TradePage.cancelOffer(this.parentElement.parentElement);">' +
                  'cancel?' +
                '</button>' +
              '</td>' +
            '</tr>');
             
  }
  
  // the following methods populate and modify the offer table
  TradePage.onLedgerResponse = function (res) {
    if (res.ledger) {
      var tbody = openOrderTable.empty();
      _.each(
        res.ledger.accountState || [],
        function (a) {
          if (a.Account == ncc.accountID && a.LedgerEntryType == "Offer") {
            tbody.append(createOrderRow(a));
          }
        }
      );
    }
  };
  
  TradePage.appendOffer = function (a) {
    var tr = openOrderTable.find('tr[data-sequence=' + a.Sequence +']');
    if (tr.length) {
      tr.replaceWith(createOrderRow(a));
    } else {
      openOrderTable.append(createOrderRow(a));
    }
  };
  
  TradePage.cancelOffer = function (rowElem) {
    var row = $(rowElem),
        button = row.find('button');
    if (button.text() == 'cancel?') {
      button.text("cancel!");
    } else {
      remote.transaction()
        .offer_cancel(ncc.accountID, row.attr('data-sequence'))
        .on('success', 
            function callback(res) {
              row.css('opacity', '0.5');
              button.attr('diabled', true);
              button.text('canceling');
            });
    }
  };
  
  TradePage.removeOrderRow = function (seq) {
    openOrderTable.find('tr[data-sequence=' + seq +']').remove();
  };

  return TradePage;
})();

exports.TradePage = TradePage;
