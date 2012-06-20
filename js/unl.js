

var unlScreen={};

unlScreen.unl=[];

unlScreen.addUNLNode= function()
{
	addr=$.trim( $("#NewUNLNodeKey").val());
	note=$.trim( $("#NewUNLNodeNote").val());
	rpc.unl_add(addr,note);
}



unlScreen.unlResponse = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		$('#status').text(JSON.stringify(response));
		if(response.result.unl)
		{
			$('#UNLTable').empty();
			unlScreen.unl=response.result.unl;
			for(var i=0; i<unlScreen.unl.length; i++)
			{
				var rowStr='<tr><td>'+i+'</td><td>'+unlScreen.unl[i].publicKey+'</td><td>'+unlScreen.unl[i].comment;
				rowStr += '</td><td><button class="btn btn-danger" onclick="unlScreen.remove('+i+')" >Remove</button></td></tr>';
				$('#UNLTable').append(rowStr);  // #PeerTable is actually the tbody element so this append works
			}
		}
			
	}else ncc.serverDown();
}


unlScreen.remove = function(index)
{
	if(index<unlScreen.unl.length)
	{
		rpc.unl_delete(unlScreen.unl[index].publicKey);
	}
}