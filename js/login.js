
var loginScreen={};

loginScreen.login = function()
{
	ncc.masterKey=$.trim( $("#MasterKey").val() );
	if($('#SaveMasterKey').is(':checked')) 
	{
		ncc.dataStore.save('MasterKey',ncc.masterKey);
	}
	
	$('#InfoMasterKey').text(ncc.masterKey);
	
	rpc.wallet_accounts(ncc.masterKey,loginScreen.loginResponse);
}

loginScreen.loginResponse = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		//$('#status').text(JSON.stringify(response));
		if(response.result.accounts)
		{
			ncc.processAccounts(response.result.accounts);
		}
		
		ncc.displayScreen('HomeScreen');
		$('#NavTabs a[href="#tabSend"]').tab('show');
		
		$('#ClientState').text('Running');
		
	}else ncc.serverDown();
}


$(document).ready(function(){

$("#MasterKey").keyup(function(event){
    if(event.keyCode == 13){
        loginScreen.login();
    }
});

});