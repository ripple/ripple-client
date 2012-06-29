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
					var amount=ncc.displayAmount(trans[n].inner.Amount);
					var str='<tr><td>'+n+'</td><td>'+trans[n].inLedger+'</td><td class="smallFont">'+trans[n].middle.SourceAccount+'</td><td class="smallFont">'+trans[n].inner.Destination+'</td><td>'+amount+'</td><td>'+trans[n].status+'</td>';
					
					$('#HistoryTable').prepend(str);
				}
			}
			
		}
		
		
	}else ncc.serverDown();
}


history.websocketMsg=function(obj)
{
	
}

