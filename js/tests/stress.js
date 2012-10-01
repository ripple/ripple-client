/*
 
*/
var stressUI={};
stressUI.createAccounts=function()
{
}

var stress={};
stress.accounts=[];

// add the masterpassphrase account
stress.startUp=function()
{
	var newAccount={};
	newAccount.master_seed="masterpassphrase"
    newAccount.account_id=response.result.account_id;
    newAccount.balance=100000000000000000;
    
	stress.accounts[0]=newAccount;
}

//this will generate N funded accounts in the ledger. It will fund them from other accounts this function has made
stress.createAccounts=function(numberToAdd)
{
	if(numberToAdd>0)
	{
		rpc.wallet_propose( function(response, success){ stress.createCB(response, success, numberToAdd); });
	}
}



stress.createCB = function (response, success, numberToAdd)
{
	if(success) 
	{
		ncc.checkError(response);
		response.result
		sender=stress.getRandomAccount();
		
		var n=Math.rand(stress.accounts.length);
		
		var amount=Math.rand()*stress.accounts[n].balance;
		if(amount>99999999)amount=99999999;
		
		stress.accounts[n].balance -= amount;
		
		var newAccount={};
		newAccount.master_seed=response.result.master_seed;
        newAccount.account_id=response.result.account_id;
        newAccount.balance=amount;
        
		stress.accounts[stress.accounts.length]=newAccount;
		rpc.send(stress.accounts[n].master_seed,stress.accounts[n].account_id,newAccount.account_id,amount,"XNS",
				function(response, success){ stress.sendCB(response, success, numberToAdd); });
	}else ncc.serverDown();
	
	
			
}

stress.sendCB = function (response, success, numberToAdd)
{
  if(success) 
  {
    ncc.checkError(response);
    stress.createAccounts(numberToAdd-1);
    
  } else ncc.serverDown();
}


stress.getRandomAccount=function()
{
	var n=Math.rand(stress.accounts.length);
	return(stressTest.accounts[n]);
}