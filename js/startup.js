// try to connect to IP and port in config.js
	// give error
	

function firstConnect(response,success) 
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		
		rpc.fetch_data('master',getMaster);
		
	}else $('#error').text('No response from server. Please check if it is running.');
};

function getMaster(response,success) 
{
	if(success)
	{
		$('#status').text(JSON.stringify(response));
		
		ncc.displayScreen('LoginScreen');
		
	}else $('#error').text('No response from server. Please check if it is running.');
};	
	
	
	
$(document).ready(function(){
	
	rpc.fetch_data('hasRun',firstConnect);
	
});