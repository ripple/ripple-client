// try to connect to IP and port in config.js
	// give error

var startUp={}

startUp.start=function()
{
	if(SERVER_IP=="127.0.0.1") 
	{
		ncc.admin=true;
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

