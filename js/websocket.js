
// handle updates from the server

var server={};
server.socket=null;

// escape a string from the server so it is safe to stick in jquery's .html()
server.escape=function(str)
{
	if(str.replace)
		return(str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;'));
	return(str);
}


server.handleMsg=function(msg)
{
	var str='';
	var obj=jQuery.parseJSON( msg.data );
	if(obj)
	{
		if(obj.type=="transactionProposed")
		{
			history.websocketMsg(obj);
		}else if(obj.type=="ledgerAccepted")
		{
			str='<div class="ledgerFeedMsg">Accepted Ledger <strong>'+server.escape(obj.seq)+'</strong> hash:'+server.escape(obj.hash)+'</div>';
		}else if(obj.type=="response")
		{
			if(obj.result=="error")
			{
				str='<div class="errorFeedMsg">Error Listening '+server.escape(obj.error)+'</div>';
			}else 
			{
				if(obj.id==1) str='<div class="stopFeedMsg">Stop Listening</div>';
				else str='<div class="startFeedMsg">Start Listening</div>';
			}
		}else
		{
			str='<div class="unknownFeedMsg">Unknown Msg: '+server.escape(msg.data)+'</div>';
		}
	}else 
	{
		str='<div class="errorFeedMsg">Error: '+server.escape(msg.data)+'</div>';
	}
	$('#FeedArea').prepend(str);
}


server.connect=function()
{
	if(!SERVER_WEBSOCKET_PORT) return;
	
	try{
		server.socket = new WebSocket("ws://"+SERVER_IP+":"+SERVER_WEBSOCKET_PORT);
		server.socket.onopen = function(){ $('#status').text("Connected to websocket");  }  
	  
	    server.socket.onmessage = server.handleMsg;
	  
	    server.socket.onclose = function(){ $('#error').text("Disconnected from websocket");  }
    } catch(exception){  
             $('#error').text('Error: '+exception);  
    }      	
}

server.subscribe=function(streamName)
{
	
	server.socket.send('{ "command" : "'+streamName+'_subscribe" }');
}

server.unsubscribe=function(streamName)
{
	server.socket.send('{ "command" : "'+streamName+'_unsubscribe", "id" : 1 }');
}

server.accountSubscribe=function(accountID)
{
	// "command" : "account_info_subscribe",
  //"accounts" : [ account_ids ]
	
	//server.socket.send('{ "command" :  "account_info_subscribe", "accounts" : ['+streamName+'_subscribe" }');
}



