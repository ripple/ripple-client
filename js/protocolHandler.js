// Try to register this page to handle toss://

var phandler={};


phandler.setup()=function()
{
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