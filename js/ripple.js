var ripple = {};

ripple.lines = [];

ripple.onShowTab = function () {
  rpc.ripple_lines_get(ncc.accountID, ripple.getLinesResponse);
}

ripple.getLinesResponse = function (response,success) {
  if (success) {
    ncc.checkError(response);
    ncc.status(JSON.stringify(response));
    
    if (response.result.lines) {
      for (var curr in ncc.balance) {
        if (curr != 'XNS') {
          delete ncc.balance[curr];
        }
      }
      $('#RippleTable').empty();
      ripple.lines = response.result.lines;
      for (var n = 0; n < ripple.lines.length; n++) {
        var str = ripple.processLine(ripple.lines[n]);
        $('#RippleTable').prepend(str);
      }
    }
  } else {
    ncc.serverDown();
  }
}

ripple.addLine = function () {
  var account = $("#NewCreditAccount").val(),
      currency = $("#NewCreditCurrency").parent().children()[1].value.substring(0,3),
      max = $("#NewCreditMax").val();
  
  rpc.ripple_line_set(ncc.masterKey, ncc.accountID, account, max, currency, ripple.setLineResponse);
}

ripple.setLineResponse = function (response,success) {
  if (success) {
    ncc.checkError(response);
    ncc.status(JSON.stringify(response));
  } else {
    ncc.serverDown();
  }
}

// {"account":"iDDXKdsoMvrJ2CUsbFbNdLFhR5nivaiNnE","balance":"0","currency":"BTC","limit":"200","limit_peer":"0","node":"E152C3D5AF05B220C71C51B3FFA0FB3F287CDBEBD3BCBC1C199E4E78C812DE49"},
// min amount | progress bar  | max amount | other account name |  change  | forgive
ripple.processLine = function (line) {
  ncc.changeBalance(line.currency, line.balance);
  return (
    '<tr>' + 
      '<td>' + (-line.limit_peer) + '</td>' +
      '<td>' + line.balance + ' ' + line.currency + '</td>' +
      '<td>' + line.limit + '</td>' +
      '<td>' + line.account + '</td>' +
      '<td></td>' + 
      '<td></td>' +
    '</tr>'
  );
}


// this will return the accountID of the line that has the most credit left in that currency 
ripple.findBestRouteIn = function (currency) {
  var bestAccount = null,
      max = 0;

  for (var n = 0; n < ripple.lines.length; n++) {
    if (ripple.lines[n].currency == currency) {
      var left = ripple.lines[n].limit - ripple.lines[n].balance;
      if (left > max) {
        max = left;
        bestAccount = ripple.lines[n].account;
      }
    }
  }
  return({ 'accountID' : bestAccount , 'max' : max }); 
}

$(document).ready(function () {
  $( "#NewCreditCurrency" ).combobox({ data: ncc.currencyOptions , selected: 'USD' });
});