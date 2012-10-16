var SendPage = new (function () {
  var address, name, currency, amount;
      // sendPageButton;
  
  function isValidAmount(amount, currency) {
    if (currency == 'XNS') {
      return (amount * BALANCE_DISPLAY_DIVISOR % 1 == 0) && (amount > 0) && (amount < 100000000000);
    } else {
      try {
        var a = new AmountValue(amount);
        assert(!a.isZero() && a.sign != '-');
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  
  function undoClasses() {
    this.classList.remove('ui-state-hover');
    this.classList.remove('ui-state-active');
  }
  
  function disableForm() {
    sendPageButton.attr('disabled', true);
    $("#t-send input").attr('disabled', true);
    $("#t-send input.ui-autocomplete-input+button")
      .each(function () { this.style.cursor = "not-allowed"; })
      .on('hover mousedown', undoClasses);
  }
  
  function enableForm() {
    sendPageButton.attr('disabled', false);
    $("#t-send input").attr('disabled', false);
    $("#t-send input.ui-autocomplete-input+button")
      .each(function () { this.style.cursor = "auto"; })
      .off('hover mousedown', undoClasses);
  }
  
  this.onShowTab = function () {
    var recentSends = _.extend(
          blobVault.getRecentSends(),
          blobVault.addressBook.getEntries()
        );
    
    sendPageButton = $("#SendPageButton")
    
    function onNewVal(e) {
      var sendDestVal = $("#SendDest").val();
      
      address = $("#SendDestSelect").val() || sendDestVal;
      name = $("#SendDestName").val() || blobVault.addressBook.getName(address);
      currency = $("#SendCurrency").val();
      amount = $("#SendAmount").val() * (currency == 'XNS' ? BALANCE_DISPLAY_DIVISOR : 1);
      
      $("#SpacerRow").show();
      $("#AddressDisplayRow").hide();
      $("#SendDestNameRow").hide();
      sendPageButton.attr('disabled', false);
      
      if (ncc.misc.isValidAddress(address) && name != 'you') {
        $("#SpacerRow").hide();
        if (address == sendDestVal) {
          // address in input box
          $("#SendDestNameRow").show();
          $("#SendDestName").val(name);
        } else {
          // name in input box
          $("#AddressDisplayRow").show();
          $("#AddressDisplay").val(address)
        }
        
        if (!isValidAmount(amount, currency)) {
          sendPageButton.attr('disabled', true);
        }
      } else {
        sendPageButton.attr('disabled', true);
      }
    }
    
    $("#t-send input").on('keydown', function (e) {
      if (e.which == 13 && !$(this).autocomplete("widget").is(":visible") && !sendPageButton.attr('disabled')) {
        sendPageButton.click();
      }
    });
    
    $("#SendDest").combobox({
      data: recentSends,
      selected: '',
      button_title: 'Recently used addresses',
      onchange: onNewVal,
      onselect: onNewVal
    });
    
    $("#t-send input").on('input', onNewVal);
    
    var select = $("#SendDestSelect");
    select.children("option[value!='']").remove();
    _.each(
      recentSends,
      function (name, addr) {
        select.append(new Option(name, addr));
      }
    );
    
    $("#SendDest").trigger('input');
  }
  
  this.send = function () {
    name = $("#SendDestName").val() || name;
    
    if (currency == 'XNS') {
      rpc.send(ncc.masterKey, ncc.accountID, address, String(amount), currency, SendPage.onSendResponse);
    } else {
      rpc.send(ncc.masterKey, ncc.accountID, address, String(amount), currency, ncc.accountID, SendPage.onSendResponse);
    }
    
    sendPageButton.text("Sending...");
    disableForm();
  }

  this.onSendResponse = function (response, success) {
    if (success) {
      if (!ncc.checkError(response)) {
        var toAccount = response.result.dstAccountID,
            curr = $("#SendCurrency").val(),
            sel = $("#SendDestSelect");
        
        if (name) {
          blobVault.addressBook.setEntry(name, toAccount);
        }
        
        blobVault.updateRecentSends(toAccount);
        blobVault.save();
        blobVault.pushToServer();
        
        sel.find("option[value=" + toAccount + "]").remove();
        sel.prepend(new Option(name || toAccount, toAccount));
        
        address = '';
        name = '';
        
        $("#SendDest").val('');
        $("#SendAmount").val('');
        $("#SendDestName").val('');
        $("#SendDestNameRow").hide();
        $("#AddressDisplay").val('');
        $("#AddressDisplayRow").hide();
        $("#SpacerRow").show();
        }
    } else {
      ncc.serverDown();
    }
    
    // re-enable form
    sendPageButton.text("Send Money");
    enableForm();
    $("#SendDest").trigger('input');
  }
  
})();


$(document).ready(function () {
  $("#SendCurrency").combobox({
    data: ncc.allCurrencyOptions,
    selected: 'XNS',
    button_title: 'Select a currency'
  });
});
