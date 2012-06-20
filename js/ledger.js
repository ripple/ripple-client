
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
				var balance=ncc.addCommas( ((accounts[i].Balance)/BALANCE_DISPLAY_DIVISOR).toFixed(2) );
				$('#LedgerTable').append('<tr><td>'+i+'</td><td>'+accounts[i].Account+'</td><td>'+balance+'</td><td>'+accounts[i].Sequence+'</td></tr>');  
			}
			
			var trans=response.result.ledger.transactions;
			$('#TransactionTable').empty();
			for(var i=0; i<trans.length; i++)
			{
				
			//<tr><th>#</th><th>From ID</th><th>To ID</th><th>Amount</th><th>Fee</th><th>Type</th></tr><
				$('#TransactionTable').append('<tr><td>'+i+'</td><td>'+trans[i].middle.SourceAccount+'</td><td>'+trans[i].inner.Destination+'</td><td>'+trans[i].inner.Amount+'</td><td>'+trans[i].middle.Fee+'</td><td>'+trans[i].middle.type+'</td></tr>');  // #PeerTable is actually the tbody element so this append works
			}
		}
			
	}else ncc.serverDown();
}