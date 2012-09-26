var welcomeScreen = {};
welcomeScreen.onShowTab = function () {};
welcomeScreen.walletProposeResponse = function () {};

var loginScreen = {};

loginScreen.onShowTab = function () {};

loginScreen.login = function () {
  blobVault.authenticate(
    this.usernameField.value,
    this.passwordField.value,
    function (authSuccess) {
      if (authSuccess) {
        if (blobVault.data.master_seed && blobVault.data.account_id) {
          ncc.masterKey = blobVault.data.master_seed;
          ncc.accountID = blobVault.data.account_id;
          loginScreen.finishLogin();
        } else {
          ncc.error("Your account has been corrupted.");
        }
      } else { // !authSuccess
        ncc.error("Bad username or password.");
      }
    }
  );
  return false;
};

loginScreen.finishLogin = function () {
  $('#NewMasterKey').text(ncc.masterKey);
  $('#NewAddress').text(ncc.accountID);
  $("#MasterKey").val(ncc.masterKey);
  $('#InfoMasterKey').text(ncc.masterKey);
  
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