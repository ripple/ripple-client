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
  var form = $("#registerForm");
  form.submit(registerScreen.onSubmit);
  form.find("input[name=username]").validateWithRegex(/./, "Good", "Bad");
  form.find("input[name=password]").passStrength({ userid: "#registerForm input[name=username]" });
  form.find("input[name=password2]").passEqual("#registerForm input[name=password]");
  form.find("input[name=pk]").validateWithRegex(/^$|^s\w{26,28}$/, "Reasonable", "Must starts with 's' and be 27-29 chars long");
  
  form.find('input').on('input', function () {
    var nonEmpty = function () { return this.name == 'pk' || this.value.length; },
        allFilled = _.all(form.find('input:text,input:password').map(nonEmpty));
    form.find("input[type=submit]").attr('disabled', form.find("input+span.badPass").length || !allFilled);
  })
});