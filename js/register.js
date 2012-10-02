var registerScreen = {};

registerScreen.onShowTab = function () {};

registerScreen.register = function () {
  var user = this.username.value,
      pass = this.password.value;
      
  if (this.password.value != this.password2.value) {
    ncc.error("Passwords must match.");
  }
  
  if (user && pass) {
    blobVault.register(user, pass, function (cont) {
      if (this.pk.value) {
        ncc.masterKey = blobVault.data.master_seed = this.pk.value;
        cont(loginScreen.finishLogin);
      } else {
        rpc.wallet_propose(function (response, success) {
          if (success) {
            var res = response.result;
            ncc.checkError(response);
            ncc.masterKey = blobVault.data.master_seed = res.master_seed;
            ncc.accountID = blobVault.data.account_id = res.account_id;
            cont(loginScreen.finishLogin);
          } else {
            ncc.serverDown();
          }
        });
      }
    });
  } else {
    ncc.error("Username and password can't be blank.");
  }
  return false;
};

$(document).ready(function () {
  $("#registerForm").submit(registerScreen.register);
  $("#registerForm input[type=password]").passStrength({
    userid: "#registerForm input[name=username]"
  });
});