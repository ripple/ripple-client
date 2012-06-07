/*
ClientState:
	connecting to network
	connecting to server
	connected to network
	Ledger split
*/

var ncc=[];

ncc.currentView='#StartScreen';
ncc.masterKey='';
ncc.accountID='';
ncc.balance=0;


ncc.displayScreen =function(screenName)
{
	$(ncc.currentView).hide();
	ncc.currentView='#'+screenName;
	$(ncc.currentView).show();
	
	if(ncc.currentView=='#HomeScreen') $("#NCCNav").show();
	else $("#NCCNav").hide();
}


ncc.login = function()
{
	ncc.masterKey=$("#MasterKey").val();
	if($('#SaveMasterKey').is(':checked')) 
	{
    	rpc.store_data('MasterKey',ncc.masterKey);
	}
	
	rpc.wallet_accounts(ncc.masterKey,ncc.loginResponse);
}

ncc.loginResponse = function(response,success)
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		ncc.displayScreen('HomeScreen');
		
		$('#ClientState').text('Running');
		
	}else $('#error').text('No response from server. Please check if it is running.');
}
//////////

ncc.send = function()
{
	toAccount=$("#SendDest").val();
	amount=$("#SendAmount").val();
	
	rpc.send(ncc.masterKey, ncc.accountID, toAccount, amount, ncc.sendResponse);
}

ncc.sendResponse = function(response,success)
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		//ncc.displayScreen('HomeScreen');
		
	}else $('#error').text('No response from server. Please check if it is running.');
}

///////////

ncc.chageTabs = function(e)
{
	e.target.onTabShown();
}



$(document).ready(function(){
	
	$(".screen").hide();
	$("#NCCNav").hide();
	
	$('#tabSend a').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	
	$('#tabHistory a').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	

	$('#tabLedger a').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	
	
	$('#tabUNL a').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	
	$('#tabPeers a').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	
	$('#tabLedger a').click(function (e) {
	  e.preventDefault();
	  $(this).tab('show');
	});
	
	var tab = document.getElementById( "LedgerTabButton");
	tab.onTabShown = rpc.ledger;
	tab = document.getElementById( "SendTabButton");
	tab.onTabShown = rpc.ledger;
	tab = document.getElementById( "HistoryTabButton");
	tab.onTabShown = rpc.ledger;
	tab = document.getElementById( "UNLTabButton");
	tab.onTabShown = rpc.unl_list;
	tab = document.getElementById( "PeersTabButton");
	tab.onTabShown = rpc.peers;
	
	
	$('a[data-toggle="tab"]').on('show', ncc.chageTabs);
	
});

