
var feed={};

feed.onShowTab = function()
{

}

feed.clear=function()
{
	$('#FeedArea').empty();
}

feed.onLedgerClick =function(ele)
{
	if(ele.checked)
	{
		server.subscribe("ledger");
	}else
	{
		server.unsubscribe("ledger");
	}
}

feed.onTransactionsClick=function(ele)
{
	if(ele.checked)
	{
		server.subscribe("transaction");
	}else
	{
		server.unsubscribe("transaction");
	}
}

feed.onServerClick=function(ele)
{
	if(ele.checked)
	{
		server.subscribe("server");
	}else
	{
		server.unsubscribe("server");
	}
}


feed.addTransaction=function(obj)
{
	
}