// try to connect to IP and port in config.js
	// give error
	

function firstConnect(response,success) 
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		
		if(response.result.value)
		{
			rpc.data_fetch('MasterKey',getMaster);
		}else
		{
			ncc.displayScreen('WelcomeScreen');
			rpc.data_store('hasRun','1');	
		}
		
		
		
	}else ncc.serverDown();
};

function getMaster(response,success) 
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		
		if(response.result.value)
		{
			ncc.masterKey=response.result.value;
			$("#MasterKey").val(ncc.masterKey);
			$('#InfoMasterKey').text(ncc.masterKey);
			
			rpc.wallet_accounts(ncc.masterKey,ncc.loginResponse);
		}else
		{
			ncc.displayScreen('LoginScreen');
		}
		
		
		
	}else ncc.serverDown();
};	
	
	
	
$(document).ready(function(){
	
	rpc.data_fetch('hasRun',firstConnect);
	
});