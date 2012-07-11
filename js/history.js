// This tab should list all the transactions you have done with any of your accounts

var history={}

history.onShowTab=function()
{
	
}

//<table class="dataTable" ><tr><th>#</th><th>Ledger</th><th>Source</th><th>Destination</th><th>Amount</th><th>Status</th></tr><tbody id="HistoryTable"></tbody></table>
history.onHistoryResponse=function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		if(response.result)
		{
			//$('#status').text(JSON.stringify(response));
			
			var str='';
			var trans=response.result.transactions;
			if(trans)
			{
				$('#HistoryTable').empty();
				for(var n=0; n<trans.length; n++)
				{
					history.addTransaction(trans[n],false);
				
				}
			}
			
		}
		
		
	}else ncc.serverDown();
}


history.addTransaction=function(trans,adjust)
{
		var amount=ncc.displayAmount(trans.inner.Amount);
		var str='<tr><td>'+trans.inLedger+'</td><td class="smallFont">'+trans.middle.SourceAccount+'</td><td class="smallFont">'+trans.inner.Destination+'</td><td>'+amount+'</td><td>'+trans.status+'</td></tr>';
		
		$('#HistoryTable').prepend(str);
		
		if(adjust)
		{
			if(trans.middle.SourceAccount==ncc.accountID)
			{
				ncc.balance -= trans.inner.Amount;
				ncc.balance -= trans.middle.Fee;
				
			}else if(trans.inner.Destination==ncc.accountID)
			{
				ncc.balance += trans.inner.Amount;
			}
			$('#Balance').text(ncc.displayAmount(ncc.balance));
		}
}

