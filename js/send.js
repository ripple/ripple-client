var SendPage = new (function () {
  var address, name, currency, amount;
  
  function isValidAmount(amount, currency) {
    if (currency == 'XNS') {
      return !(amount * BALANCE_DISPLAY_DIVISOR % 1) && (amount >= 0) && (amount < 100000000000);
    } else {
      try {
        assert((new AmountValue(amount)).sign != '-');
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  
  this.onShowTab = function () {
    var recentSends = _.extend(
      blobVault.getRecentSends(),
      blobVault.addressBook.getEntries()
    );
    
    function onNewVal(e) {
      var sendDestVal = $("#SendDest").val();
      address = $("#SendDestSelect").val() || sendDestVal,
      name = blobVault.addressBook.getName(address) || '';
      currency = $("#SendCurrency").val();
      amount = $("#SendAmount").val() * (currency == 'XNS' ? BALANCE_DISPLAY_DIVISOR : 1);
      
      $("#AddressDisplayRow").hide();
      $("#SendDestNameRow").hide();
      $("#SendPageButton").attr('disabled', false);
      
      if (ncc.misc.isValidAddress(address) && name != 'you' && isValidAmount(amount, currency)) {
        if (address == sendDestVal) {
          // address in input box
          $("#SendDestNameRow").show();
          $("#SendDestName").val(name);
        } else {
          // name in input box
          $("#AddressDisplayRow").show();
          $("#AddressDisplay").val(address)
        }
      } else {
        $("#SendPageButton").attr('disabled', true);
      }
    }
    
    $("#SendDest").combobox({
      data: recentSends,
      selected: '',
      button_title: 'Recently used addresses',
      onchange: onNewVal,
      onselect: onNewVal
    }).on('input', onNewVal);
      
    $("#t-send").find("input, select").on('keydown', function (e) {
        if (e.which == 13 && !$("#SendPageButton").attr('disabled')) $("#SendPageButton").click();
    });
    
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
    
    $("#SendPageButton").attr('disabled', true).text("Sending...");
    $("#t-send").find("input, select").attr('disabled', true);
  }

  this.onSendResponse = function (response, success) {
    console.log("Send response:", JSON.stringify(response));

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
        
        ncc.status( $("#SendAmount").val() + ' ' + curr + ' sent to ' + (name ? name + ' @ ' + toAccount : toAccount) );
        
        address = '';
        name = '';
        
        $("#SendDest").val('');
        $("#SendAmount").val('');
        $("#SendDestName").val('');
        $("#SendDestNameRow").hide();
        $("#AddressDisplay").val('');
        $("#AddressDisplayRow").hide();
      }
    } else {
      ncc.serverDown();
    }
    
    // re-enable form
    $("#SendPageButton").text("Send Money");
    $("#t-send").find("input, select").attr('disabled', false);
    $("#SendDest").trigger('input');
  }
  
})();


$(document).ready(function () {
  $("#SendCurrency").combobox({ data: ncc.allCurrencyOptions, selected: 'XNS' });
});
