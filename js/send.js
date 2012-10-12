var send = {};

send.onShowTab = function () {
  var recentSends = blobVault.getRecentSends(),
      isValidAddress = (function () {
        var r = /^i\w{30,35}$/;
        return function (a) { return r.test(a); }
      })();
  
  recentSends[''] = '';
  
  function newval() {
    var x;
    if (x = blobVault.addressBook.getAddress(this.value)) {
      $("#SendDestNameRow").hide();
      $("#AddressDisplayRow").show();
      $("#AddressDisplay").val(x)
    } else if (x = blobVault.addressBook.getName(this.value)) {
      $("#AddressDisplayRow").hide();
      $("#SendDestNameRow").show();
      $("#SendDestName").val(x)
    } else if (isValidAddress(this.value)) {
      $("#SendDestNameRow").show();
      $("#SendDestName").val("")
      $("#AddressDisplayRow").hide();
    } else {
      $("#AddressDisplayRow").hide();
      $("#SendDestNameRow").hide();
    }
  }
  
  $("#SendDest").on('input', newval)
    .combobox({
      data: recentSends,
      selected: '',
      button_title: 'Recently used addresses',
      onchange: newval,
      onselect: newval
    });
}

send.send = function () {
  var dest = $.trim( $("#SendDest").val() ),
      toAccount = blobVault.addressBook.getAddress(dest) || dest,
      currency = $("#SendCurrency").val(),
      amount = $("#SendAmount").val() * (currency == 'XNS' ? BALANCE_DISPLAY_DIVISOR : 1);
  
  if (currency == 'XNS') {
    rpc.send(ncc.masterKey, ncc.accountID, toAccount, String(amount), currency, send.onSendResponse);
  } else {
    rpc.send(ncc.masterKey, ncc.accountID, toAccount, String(amount), currency, ncc.accountID, send.onSendResponse);
  }
}

send.onSendResponse = function (response, success) {
  console.log("Send response:", JSON.stringify(response));
  
  if (success) {
    if (!ncc.checkError(response)) {
      var dest = $("#SendDest").val(),
          toAccount = blobVault.addressBook.getAddress(dest) || dest,
          destName = $("#SendDestName").val() || blobVault.addressBook.getName(toAccount),
          curr = $.trim( $("#SendCurrency").val() ).substring(0,3).toUpperCase();
      
      if (destName) {
        blobVault.addressBook.setEntry(destName, toAccount);
      }
      
      blobVault.data.recent_sends = _.without(blobVault.data.recent_sends, toAccount);
      blobVault.data.recent_sends.unshift(toAccount);
      blobVault.data.recent_sends.splice(NUM_RECENT_ADDRESSES);
      
      blobVault.save();
      blobVault.pushToServer();
      
      $("#SendDest").prev().find("option[value=" + toAccount + "]").remove();
      $("#SendDest").prev().prepend(new Option(destName || toAccount, toAccount));
      
      ncc.status( $("#SendAmount").val() + ' ' + curr + ' sent to ' + (destName ? destName + '@' + toAccount : toAccount) );
      
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
}

$(document).ready(function () {
  $("#SendCurrency").combobox({ data: ncc.allCurrencyOptions, selected: 'XNS' });
});
