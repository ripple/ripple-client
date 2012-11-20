var RippleAddress = require('./types').RippleAddress;

var RipplePage = require('./ripple').RipplePage;

var welcomeScreen = {};
welcomeScreen.onShowTab = function () {};
welcomeScreen.walletProposeResponse = function () {};

var loginScreen = {};

loginScreen.init = function () {
  $("#loginForm").submit(loginScreen.login);
};

loginScreen.onShowTab = function () {
  setTimeout(function () {
    if (localStorage.user) {
      $("#loginForm input[name=username]").val(localStorage.user);
      $("#loginForm input[name=password]").focus();
    } else {
      $("#loginForm input[name=username]").focus();
    }
  }, 1);
};

loginScreen.login = function () {
  var that = this,
      loginErr = $("#LoginError");

  $("#LoginButton").removeClass('btn-success').addClass('btn-info')
    .val("Logging in...").attr('disabled', true);

  blobVault.login(
    this.username.value,
    this.password.value,
    this.blob.value,
    function success() {
      ncc.user = localStorage.user = that.username.value;
      ncc.masterKey = blobVault.data.master_seed;
      if (ncc.misc.isValidSeed(ncc.masterKey)) {
        ncc.accountID = (new RippleAddress(ncc.masterKey)).getAddress();
      } else {
        ncc.accountID = blobVault.data.account_id;
      }
      loginScreen.finishLogin();
    },
    function error(e) {
      $("#LoginButton").removeClass('btn-success').addClass('btn-danger')
                       .val(e).attr('disabled', true);

      setTimeout(function () {
        $("#LoginButton").addClass('btn-success').removeClass('btn-danger')
                         .val("Login").attr('disabled', false);
      }, 1500);
    }
  );
  return false;
};

loginScreen.finishLogin = function () {
  $("#t-login div.heading").text("Login");
  $('#NewMasterKey').text(ncc.masterKey);
  $('#NewAddress').text(ncc.accountID);
  $('#InfoMasterKey').text(ncc.masterKey);
  $('#InfoBackupBlob').val(blobVault.blob);
  $('#RecvAddress').text(ncc.accountID);
  $('#RecvAddress2').text(ncc.accountID);

  ncc.onLogIn();

  remote.set_secret(ncc.accountID, ncc.masterKey);
  remote.request_subscribe().accounts(ncc.accountID).request();
  remote.request_ripple_lines_get(ncc.accountID).on('success', RipplePage.getLinesResponse).request();
  remote.request_wallet_accounts(ncc.masterKey)
    .on('success', function (res) {
      ncc.processAccounts(res.accounts);
      if (window.location.hash == '#t-deposit') {
        ncc.displayScreen('send');
      }
      ncc.navigateToHash();
    })
    .on('error', function () {
      ncc.displayScreen("deposit");
      ncc.navigateToHash();
    })
    .request();
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
  ncc.on('account-Payment', function () {
    $("#t-deposit p").text("Initial deposit received.");
    $("#t-deposit div.heading").text("Success!");
    ncc.hideTab('deposit');
  });
};


exports.LoginScreen = loginScreen;
exports.WelcomeScreen = welcomeScreen;
exports.DepositScreen = depositScreen;
