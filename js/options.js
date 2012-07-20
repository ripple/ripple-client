

var optionScreen={};

optionScreen.onShowTab = function()
{
	$("#ServerIPOption").val( SERVER_IP );
	$("#ServerPortOption").val(SERVER_RPC_PORT);
}

optionScreen.save = function()
{
	SERVER_IP=$.trim( $("#ServerIPOption").val() );
	SERVER_RPC_PORT=$.trim( $("#ServerPortOption").val() );
	
	$('#ServerDisplay').text("Connecting to: "+SERVER_IP+' '+SERVER_RPC_PORT);
	rpc.reload();
	
	startUp.start();
}

optionScreen.cancel = function()
{
	if(ncc.masterKey) ncc.displayScreen('HomeScreen');
	else ncc.displayScreen('LoginScreen');
}
