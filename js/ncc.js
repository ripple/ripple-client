/*
ClientState:
	Starting...
	Connected to server
	Connected to network
	Server Down
	
	these are kind of pointless. probably just report last serevr status msg here
*/

var ncc=[];

ncc.currentView='#StartScreen';
ncc.masterKey='';
ncc.accountID='';
ncc.accounts=[];
ncc.balance=0;

ncc.serverDown = function()
{
	$('#error').text('No response from server. Please check if it is running.');
}

ncc.displayScreen =function(screenName)
{
	$(ncc.currentView).hide();
	ncc.currentView='#'+screenName;
	$(ncc.currentView).show();
	
	if(ncc.currentView=='#HomeScreen') $("#NCCNav").show();
	else if(ncc.currentView=='#WelcomeScreen') rpc.wallet_propose(ncc.walletProposeResponse);
	else $("#NCCNav").hide();
}

ncc.walletProposeResponse=function(response,success)
{
	if(success)
	{
		ncc.masterKey=response.result.master_seed;
		ncc.accountID=response.result.account_id;
		
		$('#NewMasterKey').text(ncc.masterKey);
		$('#NewAddress').text(ncc.accountID);
		
		$("#MasterKey").val(ncc.masterKey);
		
	}else ncc.serverDown();
}


ncc.logout = function()
{
	rpc.data_delete('MasterKey');
	ncc.displayScreen("LoginScreen");
}

ncc.processAccounts = function(accounts)
{
	ncc.accounts=accounts;
	
	// figure total balance
	ncc.balance=0;
	ncc.accountID='';
	for(var i = 0; i < accounts.length; i++) 
	{
    	ncc.balance += accounts[i].Balance;
    	ncc.accountID= accounts[i].Account;
    }
    
    ncc.balance=ncc.balance/1000;
    
    $('#Balance').text(ncc.addCommas(ncc.balance));
    $('#RecvAddress').text(ncc.accountID);
    
}

ncc.addCommas= function(nStr) 
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}
	

///////////////////////////

ncc.login = function()
{
	ncc.masterKey=$("#MasterKey").val();
	if($('#SaveMasterKey').is(':checked')) 
	{
    	rpc.data_store('MasterKey',ncc.masterKey);
	}
	
	rpc.wallet_accounts(ncc.masterKey,ncc.loginResponse);
}

ncc.loginResponse = function(response,success)
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		if(response.result.accounts)
		{
			ncc.processAccounts(response.result.accounts);
		}
		ncc.displayScreen('HomeScreen');
		
		$('#ClientState').text('Running');
		
	}else ncc.serverDown();
}
//////////
ncc.addPeer = function()
{
	ip=$("#NewPeerIP").val();
	port=$("#NewPeerPort").val();
	rpc.connect(ip,port);
}


ncc.addUNLNode= function()
{
	addr=$("#NewUNLNodeAddr").val();
	note=$("#NewUNLNodeNote").val();
	rpc.unl_add(addr,note);
}

ncc.ledgerResponse = function(response,success)
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
			
	}else ncc.serverDown();
}

ncc.unlResponse = function(response,success)
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		if(response.result.unl)
		{
			for(var i=0; i<response.result.unl.length; i++)
			{
				$('#UNLTable').append('<tr><td>my data</td><td>more data</td></tr>');  // #PeerTable is actually the tbody element so this append works
			}
		}
			
	}else ncc.serverDown();
}

ncc.peersResponse = function(response,success)
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		if(response.result.peers)
		{
			for(var i=0; i<response.result.peers.length; i++)
			{
				$('#PeerTable').append('<tr><td>my data</td><td>more data</td></tr>');  // #PeerTable is actually the tbody element so this append works
			}
		}
			
	}else ncc.serverDown();
}

ncc.sendTabShown = function()
{
}

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
		
	}else ncc.serverDown();
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
	tab.onTabShown = function(){ rpc.ledger(ncc.ledgerResponse); }; 
	tab = document.getElementById( "SendTabButton");
	tab.onTabShown = ncc.sendTabShown;
	tab = document.getElementById( "HistoryTabButton");
	tab.onTabShown = rpc.ledger;
	tab = document.getElementById( "UNLTabButton");
	tab.onTabShown = function(){ rpc.unl_list(ncc.unlResponse); };  
	tab = document.getElementById( "PeersTabButton");
	tab.onTabShown = function(){ rpc.peers(ncc.peersResponse); };  
	
	
	$('a[data-toggle="tab"]').on('show', ncc.chageTabs);
	
});

