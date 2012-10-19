var TradePage = new (function () {
  var sellCurr, buyCurr,    // private vars
      outAmount, outIssuer,
      inAmount, inIssuer,
      price,
      
      sellCurrElem, buyCurreElem, // form elements
      amountElem, priceElem,
      buttonElem,
      
      openOrderTable;
      
  $(document).ready(function () {
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
  });  
  
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
    
    outIssuer;
    if (sellCurr == 'XNS') {
      outIssuer = '';
      outAmount *= BALANCE_DISPLAY_DIVISOR;
    } else {
      outIssuer = ncc.accountID;
    }
    
    if (buyCurr == 'XNS') { 
      inAmount *= BALANCE_DISPLAY_DIVISOR;
      var inRoute = { 'max': inAmount + 10, 'accountID': '' };
    } else {
      // need to discover the inIssuer
      var inRoute = RipplePage.findBestRouteIn(buyCurr);
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
  
  this.onShowTab = function () {
    onFieldsUpdated();
    rpc.ledger(TradePage.onLedgerResponse);
  };
  
  this.placeOrder = function () {
    rpc.offer_create(
      ncc.masterKey,
      ncc.accountID,
      String(outAmount),
      sellCurr,
      outIssuer,
      String(inAmount),
      buyCurr,
      inIssuer,
      '0',
      TradePage.onOfferCreateResponse
    );
  }
  
  this.onOfferCreateResponse = function (res, noErrors) {
    if (noErrors) {
      sellCurrElem.value('USD');
      buyCurreElem.value('XNS');
      amountElem.val('');
      priceElem.val('');
      onFieldsUpdated();
    }
  };
  
  this.status = {
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
              '<td>' + '' + '</td>' +
              '<td>' + (takerPays.value / takerGets.value) + '</td>' +
              '<td>' + takerGets.value + '</td>' +
              '<td>' +
                '<button onclick="TradePage.cancelOffer(this.parentElement.parentElement);">' +
                  'cancel?' +
                '</button>' +
              '</td>' +
            '</tr>');
             
  }
  
  // the following methods populate and modify the offer table
  this.onLedgerResponse = function (res, noErrors) {
    res = res.result || res;
    if (noErrors && res.ledger) {
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
  
  this.appendOffer = function (a) {
    var tr = openOrderTable.find('tr[data-sequence=' + a.Sequence +']');
    if (tr.length) {
      tr.replaceWith(createOrderRow(a));
    } else {
      openOrderTable.append(createOrderRow(a));
    }
  };
  
  this.cancelOffer = function (rowElem) {
    var row = $(rowElem),
        button = row.find('button');
    if (button.text() == 'cancel?') {
      button.text("cancel!");
    } else {
      rpc.offer_cancel(
        ncc.masterKey,
        ncc.accountID,
        row.attr('data-sequence'),
        function callback(res, noErrors) {
          if (noErrors) {
            row.css('opacity', '0.5');
            button.attr('diabled', true);
            button.text('canceling');
          }
        }
      );
    }
  };
  
  this.removeOrderRow = function (seq) {
    openOrderTable.find('tr[data-sequence=' + seq +']').remove();
  }
})();
