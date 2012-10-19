var ledgerScreen = {};

ledgerScreen.ledgerResponse = function (res, noErrors) {
  if (res.ledger && res.ledger.accountState) {
    ledgerScreen.addLedger(res.ledger);
  }
};

ledgerScreen.addLedger = function (ledger) {
  $('#LedgerInfoHash').text(ledger.hash);
  $('#LedgerInfoParentHash').text(ledger.parentHash);
  $('#LedgerInfoNumber').text(ledger.seqNum);
  
  var total = ncc.displayAmount(ledger.totalCoins);
  $('#LedgerInfoTotalCoins').text(total);
  $('#LedgerInfoDate').text(ledger.closeTime);
  
  stateStr = (ledger.accepted ? 'accepted ' : 'unaccepted ') +
             (ledger.closed ? 'closed ' : 'open ');
  
  $('#LedgerInfoState').text(stateStr);
  
  var accounts = ledger.accountState;
  $('#LedgerTable').empty();
  for (var i = 0; i < accounts.length; i++) {
    var row = ledgerScreen.makeRow(accounts[i],i);
    $('#LedgerTable').append(row);
  }
  
  $('#TransactionTable').empty();
  for(var i = 0; i < ledger.transactions.length; i++) {
    var tx = ledger.transactions[i],
        amount = ncc.displayAmount(tx.Amount),
        fee = ncc.addCommas( (tx.Fee / BALANCE_DISPLAY_DIVISOR).toFixed(4) );
    
    $('#TransactionTable').append(
      '<tr>' + 
        '<td>' + i + '</td>' +
        '<td>' + tx.Account + '</td>' +
        '<td>' + tx.Destination + '</td>' +
        '<td>' + amount + '</td>' +
        '<td>' + fee + '</td>' +
        '<td>' + tx.TransactionType + '</td>' +
      '</tr>'
    );
  }
}

ledgerScreen.makeRow = function (account, i)
{
  if (account.LedgerEntryType == "AccountRoot") {
    var balance = ncc.displayAmount(account.Balance);
    return '<tr><td>' + i + '</td><td>' + account.Account + '</td><td>' + balance + '</td><td>' + account.Sequence + '</td></tr>';
  }
  
  if (account.LedgerEntryType == "DirectoryRoot") {
    return '<tr><td>' + i + '</td><td>DirectoryRoot</td><td></td><td></td></tr>';
  }
  
  if (account.LedgerEntryType == "DirectoryNode") {
    return '<tr><td>' + i + '</td><td>DirectoryNode</td><td></td><td></td></tr>';
  }
  
  if (account.LedgerEntryType == "GeneratorMap") {
    return '<tr><td>' + i + '</td><td>GeneratorMap</td><td></td><td></td></tr>';
  }
  
  if (account.LedgerEntryType == "Nickname") {
    return '<tr><td>' + i + '</td><td>Nickname</td><td></td><td></td></tr>';
  }
  
  if (account.LedgerEntryType == "RippleState") {
    var balance = account.Balance.value,
        currency = account.Balance.currency;
    return '<tr><td>' + i + '</td><td>RippleState</td><td>' + balance + '</td><td>' + currency + '</td></tr>';
  }
  
  if (account.LedgerEntryType == "Offer") {
    var str = '';
    if (account.TakerGets.currency) {
      str += account.TakerGets.value + ' ' + account.TakerGets.currency;
    } else {
      str += ncc.displayAmount(account.TakerGets) + ' XNS';
    }
    
    str += ' for ';
    
    if (account.TakerPays.currency) {
      str += account.TakerPays.value + ' ' + account.TakerPays.currency;
    } else {
      str += ncc.displayAmount(account.TakerPays) + ' XNS';
    }
    
    return '<tr><td>' + i + '</td><td>Offer</td><td>' + str + '</td><td>' + account.Sequence + '</td></tr>';
  }
  return '<tr><td>' + i + '</td><td>????</td><td></td><td></td></tr>';
}