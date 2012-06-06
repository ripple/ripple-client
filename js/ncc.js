
function displaySearchResult(response) 
	{
		alert('hello');
	        if (response.result)
	                alert(response.result);
	
	        else if (response.error)
	                alert("Search error: " + response.error.message);
	};
	
var rpc=[];

rpc.call =function(request)
{
	var ip=$('#RPCIP').val();
	var port=$('#RPCPort').val();
	var url = "http://"+ip+":"+port;

	request.id = 1;

	$.post(url, JSON.stringify(request), displaySearchResult, "json");
}

rpc.peers=function ()
{
	var request = {};
	request.method = "peers";
	request.params = [];
	
	rpc.call(request);
	
	
	/*
	$.jsonRPC.setup({
	  endPoint: 'http://127.0.0.1:5005',
	  namespace: 'datagraph'
	});
	

	$.jsonRPC.request('peers', {
	  params: ['peers'],
	  success: function(result) {
	    // Do something with the result here
	    // It comes back as an RPC 2.0 compatible response object
	    alert(result);
	  },
	  error: function(result) {
	    // Result is an RPC 2.0 compatible response object
	    alert(result);
	  }
	}); */
}

rpc.stop=function ()
{
	var request = {};
	request.method = "stop";
	request.params = [];
	
	rpc.call(request);
}
