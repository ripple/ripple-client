var welcomeScreen = {};
welcomeScreen.onShowTab = function () {};
welcomeScreen.walletProposeResponse = function () {};

var loginScreen = {};

loginScreen.onShowTab = function () {
  setTimeout(function () {
    $("#loginForm")[0].username.focus();
  }, 100)
};

loginScreen.login = function () {
  try {
    blobVault.login(
      this.username.value,
      this.password.value,
      this.blob.value,
      function success() {
        ncc.masterKey = blobVault.data.master_seed;
        ncc.accountID = blobVault.data.account_id;
        loginScreen.finishLogin();
      }
    );
  } catch (e) {
    ncc.error(e);
  }
  return false;
};

loginScreen.finishLogin = function () {
  $('#NewMasterKey').text(ncc.masterKey);
  $('#NewAddress').text(ncc.accountID);
  $('#InfoMasterKey').text(ncc.masterKey);
  $('#InfoBackupBlob').val(blobVault.blob);
  
  rpc.wallet_accounts(ncc.masterKey, function (response, success) {
    if (success) {
      ncc.checkError(response);
      ncc.processAccounts(response.result.accounts || []);
      ncc.onLogIn();
      $('#ClientState').text('Logged in. Running');
    } else {
      ncc.serverDown();
    }
  });
};

loginScreen.logout = function () {
  ncc.onLogOut();
  blobVault.logout();
  $('#Balance').text('');
  $('#RecvAddress').text('');
};

$(document).ready(function () {
  $("#loginForm").submit(loginScreen.login);
});