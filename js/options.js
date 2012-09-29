var optionScreen = {};

optionScreen.onShowTab = function () {
  $("#WSServerOption").val(WS_SERVER);
  $("#RPCServerOption").val(RPC_SERVER);
  $("#BlobVaultServerOption").val(BLOBVAULT_SERVER);
}

optionScreen.save = function () {
  WS_SERVER = $.trim( $("#WSServerOption").val() );
  RPC_SERVER = $.trim( $("#RPCServerOption").val() );
  BLOBVAULT_SERVER = $.trim( $("#BlobVaultServerOption").val() );
  
  $('#ServerDisplay').text("Connecting to: " + RPC_SERVER);
  rpc.reload();
  
  startUp.start();
}

optionScreen.cancel = function () {
  if (ncc.masterKey) ncc.displayScreen('send');
  else ncc.displayScreen('welcome');
}
