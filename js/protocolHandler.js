// Try to register this page to handle toss://
// https://developer.mozilla.org/en/Web-based_protocol_handlers



var phandler={};


phandler.setup()=function()
{
	navigator.registerProtocolHandler
}

phandler.setupIE() =function()
{
}

phandler.setupFF() = function()
{
	navigator.registerProtocolHandler("mailto",  
                                  "https://www.example.com/?uri=%s",  
                                  "Example Mail");
                                  
}