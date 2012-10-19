var startUp = {};

startUp.start = function () {
  if (!Options.RPC_SERVER.indexOf("127.0.0.1") || !Options.RPC_SERVER.indexOf("localhost")) {
    ncc.admin = true;
  } else {
    ncc.admin = false;
    ncc.displayScreen('welcome');
    ncc.displayScreen('send');
  }
  
  server.connect();
  
  ncc.status("connecting to " + Options.RPC_SERVER);
  ncc.error('');
  
  $('#ServerDisplay').text("Connecting to: " + Options.RPC_SERVER);
}

