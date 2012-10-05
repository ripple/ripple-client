var optionScreen = {};

optionScreen.onShowTab = function () {
  $("#WSServerOption").val(Options.WS_SERVER);
  $("#RPCServerOption").val(Options.RPC_SERVER);
  $("#BlobVaultServerOption").val(Options.BLOBVAULT_SERVER);
}

optionScreen.save = function () {
  Options.WS_SERVER = $.trim( $("#WSServerOption").val() );
  Options.RPC_SERVER = $.trim( $("#RPCServerOption").val() );
  Options.BLOBVAULT_SERVER = $.trim( $("#BlobVaultServerOption").val() );
  Options.save();
  
  $('#ServerDisplay').text("Connecting to: " + Options.RPC_SERVER);
  rpc.reload();
  startUp.start();
}

optionScreen.cancel = function () {
  if (ncc.masterKey) ncc.displayScreen('send');
  else ncc.displayScreen('welcome');
}
