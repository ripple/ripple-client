

var trade={};

trade.onShowTab=function()
{
	
}

trade.placeOrder=function()
{
	var outCurrency=$("#PlaceOrderOutCurrency").parent().children()[1].value.substring(0,3).toUpperCase();
	var outAmount=$('#PlaceOrderAmount').val();
	var price=$('#PlaceOrderPrice').val();
	var inCurrency=$("#PlaceOrderInCurrency").parent().children()[1].value.substring(0,3).toUpperCase();
	var inAmount=outAmount*price;
	var outIssuer=ncc.accountID;
	
	if(outCurrency=='XNS') 
	{
		outIssuer='';
		outAmount *= BALANCE_DISPLAY_DIVISOR;
	}
	
	if(inCurrency=='XNS')
	{ 
		inAmount *= BALANCE_DISPLAY_DIVISOR;
		var inRoute={ 'max' : inAmount+10 , 'accountID' : ''};
	}else 
	{
		// need to discover the inIssuer
		var inRoute=ripple.findBestRouteIn(inCurrency);
	}
	
	if(inRoute.max>inAmount)
	{
		rpc.offer_create(ncc.masterKey,ncc.accountID,''+outAmount,outCurrency,outIssuer,''+inAmount,inCurrency,inRoute.accountID,'0',trade.onOfferCreateResponse);
	}else
	{
		ncc.error("You need to increase your ripple credit lines to take in that much "+inCurrency+".");
	}
}

trade.onOfferCreateResponse=function(response,success)
{
	console.log(JSON.stringify(response));
	
	if(success)
	{
		ncc.checkError(response);
		if(response.result)
		{
		}
	}else ncc.serverDown();
}

$(document).ready(function(){
	$("#PlaceOrderOutCurrency").combobox({ data: ncc.allCurrencyOptions , selected: 'USD' });
	$("#PlaceOrderInCurrency").combobox({ data: ncc.allCurrencyOptions , selected: 'XNS' });
});