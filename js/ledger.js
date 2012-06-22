
var ledgerScreen ={};

ledgerScreen.ledgerResponse = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		//$('#status').text(JSON.stringify(response));
		
		if(response.result.ledger && response.result.ledger.accountState)
		{
			$('#LedgerInfoHash').text(response.result.ledger.hash);
			$('#LedgerInfoParentHash').text(response.result.ledger.parentHash);
			$('#LedgerInfoNumber').text(response.result.ledger.seqNum);
			var total=ncc.addCommas( ((response.result.ledger.totalCoins)/BALANCE_DISPLAY_DIVISOR).toFixed(2) );
			$('#LedgerInfoTotalCoins').text(total);
			$('#LedgerInfoDate').text(response.result.ledger.closeTime);
			
			stateStr='';
			if(response.result.ledger.accepted) stateStr += 'accepted ';
			else stateStr += 'unaccepted ';
			if(response.result.ledger.closed) stateStr += 'closed ';
			else stateStr += 'open ';
			
			$('#LedgerInfoState').text(stateStr);
		
			var accounts=response.result.ledger.accountState;
			$('#LedgerTable').empty();
			for(var i=0; i<accounts.length; i++)
			{
				var row=ledgerScreen.makeRow(accounts[i],i);
				$('#LedgerTable').append(row);  
			}
			
			var trans=response.result.ledger.transactions;
			$('#TransactionTable').empty();
			for(var i=0; i<trans.length; i++)
			{
				var amount=ncc.addCommas( ((trans[i].inner.Amount)/BALANCE_DISPLAY_DIVISOR).toFixed(2) );
				var fee=ncc.addCommas( ((trans[i].inner.Fee)/BALANCE_DISPLAY_DIVISOR).toFixed(4) );
			//<tr><th>#</th><th>From ID</th><th>To ID</th><th>Amount</th><th>Fee</th><th>Type</th></tr><
				$('#TransactionTable').append('<tr><td>'+i+'</td><td>'+trans[i].middle.SourceAccount+'</td><td>'+trans[i].inner.Destination+'</td><td>'+amount+'</td><td>'+fee+'</td><td>'+trans[i].middle.type+'</td></tr>');  // #PeerTable is actually the tbody element so this append works
			}
		}
			
	}else ncc.serverDown();
}



ledgerScreen.makeRow=function(account,i)
{
	if(account.type=="AccountRoot")
	{
		var balance=ncc.addCommas( ((account.Balance)/BALANCE_DISPLAY_DIVISOR).toFixed(2) );
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
		return('<tr><td>'+i+'</td><td>RippleState</td><td></td><td></td></tr>');
	}
	return('<tr><td>'+i+'</td><td>????</td><td></td><td></td></tr>');
}