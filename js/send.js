
var send={}


send.onShowTab = function()
{
}



send.send = function()
{
	toAccount=$.trim( $("#SendDest").val() );
	
	currency= $("#SendCurrency").parent().children()[1].value.substring(0,3).toUpperCase();
	if(currency=='XNS') amount=''+$.trim( $("#SendAmount").val() )*BALANCE_DISPLAY_DIVISOR;
	else amount=''+$.trim( $("#SendAmount").val() );
	
	rpc.send(ncc.masterKey, ncc.accountID, toAccount, amount, currency, send.onSendResponse);
}

send.onSendResponse = function(response,success)
{
	console.log("Send response:"+JSON.stringify(response));
	
	if(success)
	{
		if(!ncc.checkError(response))
		{
			currency=$.trim( $("#SendCurrency").val() ).substring(0,3).toUpperCase();
			ncc.status($("#SendAmount").val()+' '+currency+' Sent to '+$("#SendDest").val());
			$("#SendDest").val('');
			$("#SendAmount").val('');
		}
	}else ncc.serverDown();
}


$(document).ready(function(){
		$( "#SendCurrency" ).combobox({ data: ncc.allCurrencyOptions , selected: 'XNS' });
	});