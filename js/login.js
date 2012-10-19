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
  var that = this;
  blobVault.login(
    this.username.value,
    this.password.value,
    this.blob.value,
    function success() {
      ncc.user = that.username.value;
      ncc.masterKey = blobVault.data.master_seed;
      ncc.accountID = blobVault.data.account_id;
      loginScreen.finishLogin();
    },
    function error(e) {
      ncc.error(e);
    }
  );
  return false;
};

loginScreen.finishLogin = function () {
  $('#NewMasterKey').text(ncc.masterKey);
  $('#NewAddress').text(ncc.accountID);
  $('#InfoMasterKey').text(ncc.masterKey);
  $('#InfoBackupBlob').val(blobVault.blob);
  
  server.accountSubscribe(ncc.accountID);
  
  rpc.wallet_accounts(
    ncc.masterKey,
    function (res, noErrors) {
      res = res.result || res;
      ncc.processAccounts(res.accounts || []);
      ncc.onLogIn();
      $('#ClientState').html(
        'Logged in as ' + ncc.user +
        '. <a href="#" onclick="document.location=\'\'">Sign out</a>.'
      );
      if (!noErrors) {
        ncc.displayTab("deposit");
        ncc.displayScreen("deposit");
      }
    }
  );
};

loginScreen.logout = function () {
  ncc.onLogOut();
  blobVault.logout();
  $('#Balance').text('');
  $('#RecvAddress').text('');
  $('#RecvAddress2').text('');
};

var depositScreen = {};

depositScreen.onShowTab = function () {
  ncc.on('transaction', function () {
    $("#t-deposit p").text("Well done!");
    $("#t-deposit div.heading").text("Deposit complete!");
    ncc.hideTab('deposit')
  });
};

$(document).ready(function () {
  $("#loginForm").submit(loginScreen.login);
});