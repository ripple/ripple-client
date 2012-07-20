
var loginScreen={};
var welcomeScreen={};

welcomeScreen.onShowTab = function() 
{
	rpc.wallet_propose(welcomeScreen.walletProposeResponse);
}

welcomeScreen.walletProposeResponse=function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		if(response.result)
		{
			ncc.masterKey=response.result.master_seed;
			ncc.accountID=response.result.account_id;
			
			$('#NewMasterKey').text(ncc.masterKey);
			$('#NewAddress').text(ncc.accountID);
			
			$("#MasterKey").val(ncc.masterKey);
		}
		
	}else ncc.serverDown();
}

loginScreen.onShowTab = function() {}


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
	console.log(JSON.stringify(response));
	if(success)
	{
		ncc.checkError(response);
		
		if(response.result.accounts)
		{
			ncc.processAccounts(response.result.accounts);
		}
		
		ncc.onLogIn();
		
		
		$('#ClientState').text('Logged in. Running');
		
	}else ncc.serverDown();
}

loginScreen.logout = function()
{
	rpc.data_delete('MasterKey');
	ncc.onLogOut();
	$('#Balance').text('');
    $('#RecvAddress').text('');
}


$(document).ready(function(){

$("#MasterKey").keyup(function(event){
    if(event.keyCode == 13){
        loginScreen.login();
    }
});

});