var registerScreen = {};

registerScreen.onShowTab = function () {};

registerScreen.onSubmit = function () {
  var form = this,
      user = form.username.value,
      pass = form.password.value;
  
  if (form.password.value != form.password2.value) {
    ncc.error("Passwords must match.");
    return false;
  }
  
  function save_and_login() {
    blobVault.save();
    blobVault.login(user, pass, '', loginScreen.finishLogin, function onFailure(e) {
      ncc.error(e);
    });
  }
  
  if (user && pass) {
    blobVault.register(user, pass);
    if (form.pk.value) {
      ncc.masterKey = blobVault.data.master_seed = form.pk.value;
      save_and_login();
    } else {
      rpc.wallet_propose(function (res, success) {
        if (success) {
          ncc.checkError(res);
          ncc.masterKey = blobVault.data.master_seed = res.result.master_seed;
          ncc.accountID = blobVault.data.account_id = res.result.account_id;
          save_and_login();
        } else {
          ncc.serverDown();
        }
      });
    }
  } else {
    ncc.error("Username and password can't be blank.");
  }
  return false;
};

$(document).ready(function () {
  $("#registerForm").submit(registerScreen.onSubmit);
  $("#registerForm input[name=password]").passStrength({ userid: "#registerForm input[name=username]" });
  $("#registerForm input[name=password2]").passEqual("#registerForm input[name=password]");
});