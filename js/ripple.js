
var ripple={};

ripple.lines=[];

ripple.onShowTab = function()
{
	rpc.ripple_lines_get(ncc.accountID,ripple.getLinesResponse);
}

ripple.getLinesResponse  = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		$('#status').text(JSON.stringify(response));
		if(response.result.lines)
		{
			$('#RippleTable').empty();
			ripple.lines=response.result.lines;
			for(var n=0; n<ripple.lines.length; n++)
			{
				var str=ripple.processLine(ripple.lines[n]);
				$('#RippleTable').prepend(str);
			}
			
		}
	}else ncc.serverDown();
}

ripple.addLine=function()
{
	
	account=$("#NewCreditAccount").val();
	currency= $("#NewCreditCurrency").parent().children()[1].value.substring(0,3);
	//currency=$("#NewCreditCurrencyInput").val().substring(0,3);
	//var test=document.getElementById('NewCreditCurrency');
	//currency=$("#NewCreditCurrency").getText().substring(0,3);
	//currency=test.getText().substring(0,3);
	max=$("#NewCreditMax").val();
	
	rpc.ripple_line_set(ncc.masterKey,ncc.accountID, account,max, currency,ripple.setLineResponse);
}

ripple.setLineResponse  = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		$('#status').text(JSON.stringify(response));
		
	}else ncc.serverDown();
}

// {"account":"iDDXKdsoMvrJ2CUsbFbNdLFhR5nivaiNnE","balance":"0","currency":"BTC","limit":"200","limit_peer":"0","node":"E152C3D5AF05B220C71C51B3FFA0FB3F287CDBEBD3BCBC1C199E4E78C812DE49"},
// min amount | progress bar  | max amount | other account name |  change  | forgive
ripple.processLine=function(line)
{
	var str='<tr><td>'+(-line.limit_peer)+'</td><td>'+line.balance+' '+line.currency+'</td><td>'+line.limit+'</td><td>'+line.account+'</td><td></td><td></td></tr>';
	return(str);
}


// this will return the accountID of the line that has the most credit left in that currency 
ripple.findBestRouteIn=function(currency)
{
	var bestAccount=null;
	var max=0;
	for(var n=0; n<ripple.lines.length; n++)
	{
		if(ripple.lines[n].currency==currency)
		{
			var left=ripple.lines[n].limit-ripple.lines[n].balance;
			if(left>max) max=left;
		}
	}
	return( {'accountID' : bestAccount , 'max' : max} ); 
}

										

$(document).ready(function(){
	
		$( "#NewCreditCurrency" ).combobox({ data: ncc.currencyOptions , selected: 'USD' });
	});