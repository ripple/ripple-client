window.ncc = require('../client/ncc');
window.blobVault = require('../client/blobvault');

var RegisterScreen = require('../client/register').RegisterScreen;

$(document).ready(function () {
  ncc.init();
  RegisterScreen.init();
});
