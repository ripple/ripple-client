var SendPage = new (function () {
  var address, name;
  
  this.onShowTab = function () {
    var recentSends = blobVault.getRecentSends(),
        isValidAddress = (function () {
          var r = /^r\w{30,35}$/;
          return function (a) { return r.test(a); }
        })();
    
    function onNewVal() {
      address = $("#SendDestSelect").val() || this.value,
      name = blobVault.addressBook.getName(address) || '';
      
      $("#AddressDisplayRow").hide();
      $("#SendDestNameRow").hide();
      $("#SendPageButton").attr('disabled', false);
      
      if (isValidAddress(address)) {
        if (address == this.value) {
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
    var currency = $("#SendCurrency").val(),
        amount = $("#SendAmount").val() * (currency == 'XNS' ? BALANCE_DISPLAY_DIVISOR : 1);
    
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
        
        blobVault.data.recent_sends = _.without(blobVault.data.recent_sends, toAccount);
        blobVault.data.recent_sends.unshift(toAccount);
        blobVault.data.recent_sends.splice(NUM_RECENT_ADDRESSES);
        
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
        
        $("#SendPageButton").attr('disabled', false).text("Send Money");
        $("#t-send").find("input, select").attr('disabled', false);
      }
    } else {
      ncc.serverDown();
    }
  }
  
})();


$(document).ready(function () {
  $("#SendCurrency").combobox({ data: ncc.allCurrencyOptions, selected: 'XNS' });
});
