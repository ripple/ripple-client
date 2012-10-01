/*
needs to:
- do 10k sends as fast as you can 
- send money back and forth between two accounts as fast as possible for 10 min
- change ripple balance as fast as you can for 10 min 
- make, take, remove offers from one 

*/
var slammer={};

slammer.send=function()
{
	var amount=10*BALANCE_DISPLAY_DIVISOR;
	
	
	for(var n=0; n<10000; n++)
	{
		if(n%1000==0)console.log("At: "+n);
		
		rpc.send('masterpassphrase', 'iHb9CJAWyB4ij91VRWn96DkukG4bwdtyTh', 'iGeXL3fN2mMXPmSM4aWTYt9sjMsNShV61b', amount, 'XNS', slammer.onSendResponse);	
	}
}

slammer.onSendResponse = function(response,success)
{
	
}

slammer.bobble=function()
{

	for(var n=1; n<10000; n++)
	{
		if(n%1000==0)console.log("At: "+n);
		
		rpc.send('masterpassphrase', 'iHb9CJAWyB4ij91VRWn96DkukG4bwdtyTh', 'iGeXL3fN2mMXPmSM4aWTYt9sjMsNShV61b', 2000*n, 'XNS', slammer.onSendResponse);
		rpc.send('sh9TTYZi9BoAqeoLSz9C67iTUtsT7', 'iGeXL3fN2mMXPmSM4aWTYt9sjMsNShV61b', 'iHb9CJAWyB4ij91VRWn96DkukG4bwdtyTh', 1000*n, 'XNS', slammer.onSendResponse);	
	}
}

slammer.addRippleLine=function()
{

	account=$("#NewCreditAccount").val();
	currency= $("#NewCreditCurrency").parent().children()[1].value.substring(0,3);
	max=$("#NewCreditMax").val();
	
	
	rpc.ripple_line_set(ncc.masterKey,ncc.accountID, account,max, currency,slammer.onSendResponse);
}