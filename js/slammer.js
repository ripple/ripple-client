/*
needs to:
- send money back and forth between two accounts as fast as possible for 10 min
- make, take, remove offers from one 

*/
var slammer={};

slammer.send=function()
{
	toAccount=$.trim( $("#SendDest").val() );
	
	currency= $("#SendCurrency").parent().children()[1].value.substring(0,3).toUpperCase();
	if(currency=='XNS') amount=''+$.trim( $("#SendAmount").val() )*BALANCE_DISPLAY_DIVISOR;
	else amount=''+$.trim( $("#SendAmount").val() );
	
	
	for(var n=0; n<10000; n++)
	{
		if(n%1000==0)console.log("At: "+n);
		
		rpc.send(ncc.masterKey, ncc.accountID, toAccount, amount, currency, slammer.onSendResponse);	
	}
}

slammer.onSendResponse = function(response,success)
{
	
}