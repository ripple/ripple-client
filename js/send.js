var send = {};

send.onShowTab = function () {}

send.send = function () {
  var toAccount = $.trim( $("#SendDest").val() ),
      currency = $("#SendCurrency").val(),
      amount = $("#SendAmount").val() * (currency == 'XNS' ? BALANCE_DISPLAY_DIVISOR : 1);
  
  rpc.send(ncc.masterKey, ncc.accountID, toAccount, String(amount), currency, send.onSendResponse);
}

send.onSendResponse = function (response, success) {
  console.log("Send response:", JSON.stringify(response));
  
  if (success) {
    if (!ncc.checkError(response)) {
      currency = $.trim( $("#SendCurrency").val() ).substring(0,3).toUpperCase();
      ncc.status( $("#SendAmount").val() + ' ' + currency + ' Sent to ' + $("#SendDest").val() );
      $("#SendDest").val('');
      $("#SendAmount").val('');
    }
  } else {
    ncc.serverDown();
  }
}

$(document).ready(function () {
  $("#SendCurrency").combobox({ data: ncc.allCurrencyOptions, selected: 'XNS' });
});
