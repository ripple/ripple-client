// This tab should list all the transactions you have done with any of your accounts

var HistoryPage = {};

HistoryPage.onShowTab = function () {};

//<table class="dataTable" ><tr><th>#</th><th>Ledger</th><th>Source</th><th>Destination</th><th>Amount</th><th>Status</th></tr><tbody id="HistoryTable"></tbody></table>
HistoryPage.onHistoryResponse = function (response, success) {
  if (success) {
    ncc.checkError(response);
    if (response.result) {
      //$('#status').text(JSON.stringify(response));
      
      var str = '';
      var trans = response.result.transactions;
      if (trans) {
        $('#HistoryTable').empty();
        for (var n = 0; n < trans.length; n++) {
          HistoryPage.addTransaction(trans[n], false);
        }
      }
    }
  } else {
    ncc.serverDown();
  }
}

HistoryPage.addTransaction = function (t, adjust) {
  if (t.TransactionType == 'CreditSet') {
    var amount = ncc.displayAmount(t.LimitAmount.value);
  } else if (t.TransactionType == 'OfferCreate') {
    return;
  } else {
    var amount = ncc.displayAmount(t.Amount);
  }

  var oldEntry = $('#' + t.id);
  if (oldEntry.length) {
    var str = ( '<td>' + t.inLedger + '</td>' +
                '<td>' + t.TransactionType + '</td>' +
                '<td class="addr smallFont">' + t.Account + '</td>' +
                '<td class="addr smallFont">' + t.Destination + '</td>' +
                '<td>' + amount + '</td>' +
                '<td>' + t.status + '</td>' );
    oldEntry.html(str);
  } else {
    var str = '<tr id="' + t.id + '">' + 
                '<td>' + t.inLedger + '</td>' +
                '<td>' + t.TransactionType + '</td>' +
                '<td class="addr smallFont">' + t.Account + '</td>' +
                '<td class="addr smallFont">' + t.Destination + '</td>' +
                '<td>' + amount + '</td>' +
                '<td>' + t.status + '</td>' +
              '</tr>';
    $('#HistoryTable').prepend(str);
    
    if (adjust) {
      if (t.TransactionType == 'CreditSet' && t.Account == ncc.accountID) {
        ncc.changeBalance('XNS', -t.Fee);
        return;
      }
      
      var curr = t.Amount.currency || 'XNS',
          amt = t.Amount.value || t.Amount;
      
      if (t.Account == ncc.accountID) {
        ncc.changeBalance(curr, -amt);
        ncc.changeBalance('XNS', -t.Fee);
      }
      
      if (t.Destination == ncc.accountID) {
        ncc.changeBalance(curr, amt);
      }
    }
  }
}

