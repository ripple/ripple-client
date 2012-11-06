var OptionsPage = {};

OptionsPage.onShowTab = function () {
  $("#WSServerOption").val(Options.WS_SERVER);
  $("#BlobVaultServerOption").val(Options.BLOBVAULT_SERVER);
}

OptionsPage.save = function () {
  Options.WS_SERVER = $.trim( $("#WSServerOption").val() );
  Options.BLOBVAULT_SERVER = $.trim( $("#BlobVaultServerOption").val() );
  Options.save();
  startUp.start();
}

OptionsPage.cancel = function () {
  if (ncc.masterKey) ncc.displayScreen('send');
  else ncc.displayScreen('welcome');
}
