var startUp = {};

startUp.start = function () {
  if (!RPC_SERVER.indexOf("127.0.0.1") || !RPC_SERVER.indexOf("localhost")) {
    ncc.admin = true;
  } else {
    ncc.admin = false;
    ncc.displayScreen('welcome');
    ncc.displayScreen('send');
  }
  
  server.connect();
  
  ncc.status("Connecting to: " + RPC_SERVER);
  ncc.error('');
  
  $('#ServerDisplay').text("Connecting to: " + RPC_SERVER);
}

