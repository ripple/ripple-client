// try to connect to IP and port in config.js
	// give error

var startUp={}

startUp.start=function()
{
	if(SERVER_IP=="127.0.0.1") 
	{
		ncc.admin=true;
		rpc.data_fetch('hasRun',startUp.firstConnect);
	}else 
	{
		ncc.admin=false;
		ncc.displayScreen('WelcomeScreen');
	}
	
	server.connect();
	
	ncc.status("Connecting to: "+SERVER_IP+' '+SERVER_RPC_PORT);
	ncc.error('');
	
	$('#ServerDisplay').text("Connecting to: "+SERVER_IP+' '+SERVER_RPC_PORT);
}

startUp.firstConnect= function(response,success) 
{
	if(success)
	{
		//$('#status').text(JSON.stringify(response));
		
		if(response.result.value)
		{
			rpc.data_fetch('MasterKey',startUp.getMaster);
		}else
		{
			welcomeScreen.onShowTab();
			rpc.data_store('hasRun','1');	
		}
	}else 
	{
		ncc.status('');
		ncc.displayScreen('NoServerScreen');
		ncc.serverDown();
	}
};

startUp.getMaster=function(response,success) 
{
	if(success)
	{
		//$('#status').text(JSON.stringify(response));
		
		if(response.result.value)
		{
			ncc.masterKey=response.result.value;
			$("#MasterKey").val(ncc.masterKey);
			$('#InfoMasterKey').text(ncc.masterKey);
			
			rpc.wallet_accounts(ncc.masterKey,loginScreen.loginResponse);
		}else
		{
			ncc.displayScreen('login');
		}
	}else ncc.serverDown();
};	
	
