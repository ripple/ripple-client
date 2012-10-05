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

HistoryPage.addTransaction = function (trans, adjust) {
  if (trans.TransactionType == 'CreditSet') {
    var amount = ncc.displayAmount(trans.LimitAmount.value);
  } else if (trans.TransactionType == 'OfferCreate') {
    return;
  } else {
    var amount = ncc.displayAmount(trans.Amount);
  }

  var oldEntry = $('#' + trans.id);
  if (oldEntry.length) {
    var str = '<td>' + trans.inLedger + '</td><td>' + trans.TransactionType + '</td><td class="smallFont">' + trans.Account + '</td><td class="smallFont">' + trans.Destination + '</td><td>' + amount + '</td><td>' + trans.status + '</td>';
    oldEntry.html(str);
  } else {
    var str = '<tr id="' + trans.id + '"><td>' + trans.inLedger + '</td><td>' + trans.TransactionType + '</td><td class="smallFont">' + trans.Account + '</td><td class="smallFont">' + trans.Destination + '</td><td>' + amount + '</td><td>' + trans.status + '</td></tr>';
    $('#HistoryTable').prepend(str);
    
    if (adjust) {
      var curr = trans.Amount.currency || 'XNS',
          amt = trans.Amount.value || trans.Amount;
      
      if (trans.Account == ncc.accountID) {
        ncc.changeBalance(curr, -amt);
        ncc.changeBalance('XNS', -trans.Fee);
      }
      
      if (trans.Destination == ncc.accountID) {
        ncc.changeBalance(curr, amt);
      }
    }
  }
}

