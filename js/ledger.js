
var ledgerScreen ={};

ledgerScreen.ledgerResponse = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		//$('#status').text(JSON.stringify(response));
		
		if(response.result.ledger && response.result.ledger.accountState)
		{
			ledgerScreen.addLedger(response.result.ledger);
		}
			
	}else ncc.serverDown();
}

ledgerScreen.addLedger=function(ledger)
{
	$('#LedgerInfoHash').text(ledger.hash);
	$('#LedgerInfoParentHash').text(ledger.parentHash);
	$('#LedgerInfoNumber').text(ledger.seqNum);
	var total=ncc.displayAmount(ledger.totalCoins);
	$('#LedgerInfoTotalCoins').text(total);
	$('#LedgerInfoDate').text(ledger.closeTime);
	
	stateStr='';
	if(ledger.accepted) stateStr += 'accepted ';
	else stateStr += 'unaccepted ';
	if(ledger.closed) stateStr += 'closed ';
	else stateStr += 'open ';
	
	$('#LedgerInfoState').text(stateStr);

	var accounts=ledger.accountState;
	$('#LedgerTable').empty();
	for(var i=0; i<accounts.length; i++)
	{
		var row=ledgerScreen.makeRow(accounts[i],i);
		$('#LedgerTable').append(row);  
	}
	
	var trans=ledger.transactions;
	$('#TransactionTable').empty();
	for(var i=0; i<trans.length; i++)
	{
		var amount=ncc.displayAmount(trans[i].inner.Amount);
		var fee=ncc.addCommas( ((trans[i].middle.Fee)/BALANCE_DISPLAY_DIVISOR).toFixed(4) );
	//<tr><th>#</th><th>From ID</th><th>To ID</th><th>Amount</th><th>Fee</th><th>Type</th></tr><
		$('#TransactionTable').append('<tr><td>'+i+'</td><td>'+trans[i].middle.SourceAccount+'</td><td>'+trans[i].inner.Destination+'</td><td>'+amount+'</td><td>'+fee+'</td><td>'+trans[i].middle.type+'</td></tr>');  // #PeerTable is actually the tbody element so this append works
	}
}



ledgerScreen.makeRow=function(account,i)
{
	if(account.type=="AccountRoot")
	{
		var balance=ncc.displayAmount(account.Balance);
		return('<tr><td>'+i+'</td><td>'+account.Account+'</td><td>'+balance+'</td><td>'+account.Sequence+'</td></tr>');
	}  
	if(account.type=="DirectoryRoot")
	{
		return('<tr><td>'+i+'</td><td>DirectoryRoot</td><td></td><td></td></tr>');
	}
	
	if(account.type=="DirectoryNode")
	{
		return('<tr><td>'+i+'</td><td>DirectoryNode</td><td></td><td></td></tr>');
	}
	
	if(account.type=="GeneratorMap")
	{
		return('<tr><td>'+i+'</td><td>GeneratorMap</td><td></td><td></td></tr>');
	}
	
	if(account.type=="Nickname")
	{
		return('<tr><td>'+i+'</td><td>Nickname</td><td></td><td></td></tr>');
	}
	if(account.type=="RippleState")
	{
		var balance=account.Balance.value;
		var currency=account.Balance.currency;
		return('<tr><td>'+i+'</td><td>RippleState</td><td>'+balance+'</td><td>'+currency+'</td></tr>');
	}
	if(account.type=="Offer")
	{
		var str='';
		if(account.TakerGets.currency)
		{
			str += account.TakerGets.value+' '+account.TakerGets.currency;
		}else
		{
			str += ncc.displayAmount(account.TakerGets)+' XNS';
			
		}
		str += ' for ';
		if(account.TakerPays.currency)
		{
			str += account.TakerPays.value+' '+account.TakerPays.currency;
		}else
		{
			str += ncc.displayAmount(account.TakerPays)+' XNS';
		}
		
		return('<tr><td>'+i+'</td><td>Offer</td><td>'+str+'</td><td>'+account.Sequence+'</td></tr>');
	}
	return('<tr><td>'+i+'</td><td>????</td><td></td><td></td></tr>');
}