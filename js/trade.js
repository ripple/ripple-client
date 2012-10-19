var TradePage = new (function () {
  var sellCurr, buyCurr,    // private vars
      outAmount, outIssuer,
      inAmount, inIssuer,
      price,
      
      sellCurrElem, buyCurreElem, // form elements
      amountElem, priceElem,
      buttonElem;
  
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
  
  this.onOfferCreateResponse = function (response, noErrors) {
    if (noErrors) {
      sellCurrElem.value('USD');
      buyCurreElem.value('XNS');
      amountElem.val('');
      priceElem.val('');
      onFieldsUpdated();
    }
  }
  
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
    
  }
  
})();
