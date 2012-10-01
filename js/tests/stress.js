/*
	pull the ledger on startup and create all the accounts based on that. (We won't know the masterkeys though)
	
	not all accounts are being made

*/

var stressUI={};
stressUI.createAccounts=function()
{
	var num=$("#NumStressAccounts").val();
	console.log("Creating "+num+" accounts");
	stress.createAccounts(num);
}

stressUI.doSends=function()
{
	var num=$("#NumStressSends").val();
	console.log("Doing "+num+" sends");
	stress.doSends(num);
}

stressUI.createLines=function()
{
	var num=$("#NumStressLines").val();
	console.log("Giving each account "+num+" lines");
	
	stress.createLines(0,num);
}

var stress={};
stress.accounts=[];
stress.currencies=['USD','BTC','EUR','YEN'];

// add the masterpassphrase account
stress.startUp=function()
{
	var newAccount={};
	newAccount.master_seed="masterpassphrase"
    newAccount.account_id="iHb9CJAWyB4ij91VRWn96DkukG4bwdtyTh";
    newAccount.balance=100000000000000;
    
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

stress.createLines=function(index,num)
{
	if(index>=stress.accounts.length) 
	{
		index=0;
		num--;
	}
	
	if(num>0)
	{
		var j=Math.floor(Math.random()*stress.accounts.length);
		
		var amount=Math.floor(Math.random()*1000);
		var currency=stress.currencies[Math.floor(Math.random()*stress.currencies.length)];
		
		
		
		amount *= BALANCE_DISPLAY_DIVISOR;
		console.log("Sending:"+stress.accounts[index].master_seed+" "+stress.accounts[index].account_id+" "+stress.accounts[j].account_id+" "+amount+" XNS");
		
		rpc.ripple_line_set(stress.accounts[index].master_seed, stress.accounts[index].account_id, stress.accounts[j].account_id,amount, currency,
			function(response, success){ stress.createLineCB(response, success, index,num); });
	}
}

stress.createLineCB = function(response, success, index,num)
{
	if(success) 
	{
		ncc.checkError(response);
		stress.createLines(index+1,num);
	}else ncc.serverDown();
}



stress.createCB = function(response, success, numberToAdd)
{
	if(success) 
	{
		ncc.checkError(response);
		
		
		//var n=Math.floor(Math.random()*stress.accounts.length);
		var n=0;
		
		var amount=Math.floor(Math.random()*stress.accounts[n].balance);
		if(amount>99999)amount=99999;
		
		
		stress.accounts[n].balance -= amount;
		
		var newAccount={};
		newAccount.master_seed=response.result.master_seed;
        newAccount.account_id=response.result.account_id;
        newAccount.balance=amount;
        
		stress.accounts[stress.accounts.length]=newAccount;
		
		amount *= BALANCE_DISPLAY_DIVISOR;
		console.log("Sending:"+stress.accounts[n].master_seed+" "+stress.accounts[n].account_id+" "+newAccount.account_id+" "+amount+" XNS");
		
		rpc.send(stress.accounts[n].master_seed,stress.accounts[n].account_id,newAccount.account_id,""+amount,"XNS",
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

stress.doSendsCB = function (response, success, numberToAdd)
{
  if(success) 
  {
    ncc.checkError(response);
    stress.doSends(numberToAdd-1);
    
  } else ncc.serverDown();
}

//this will send between random accounts
stress.doSends=function(numberOfSends)
{
	if(numberOfSends>0)
	{
		var i=Math.floor(Math.random()*stress.accounts.length);
		var j=Math.floor(Math.random()*stress.accounts.length);
		
		var amount=Math.floor(Math.random()*stress.accounts[i].balance);
		if(amount>99999)amount=99999;
		
		
		stress.accounts[i].balance -= amount;
		stress.accounts[j].balance += amount;
		
		
		
		amount *= BALANCE_DISPLAY_DIVISOR;
		console.log("Sending:"+stress.accounts[i].master_seed+" "+stress.accounts[i].account_id+" "+stress.accounts[j].account_id+" "+amount+" XNS");
		
		rpc.send(stress.accounts[i].master_seed,stress.accounts[i].account_id,stress.accounts[j].account_id,""+amount,"XNS",
				function(response, success){ stress.doSendsCB(response, success, numberOfSends); });
	}
}


/*
stress.getRandomAccount=function()
{
	var n=Math.rand(stress.accounts.length);
	return(stressTest.accounts[n]);
}*/