var registerScreen = {};

registerScreen.onShowTab = function () {};

registerScreen.onSubmit = function () {
  var form = this,
      user = form.username.value,
      pass = form.password.value,
      regErr = $("#RegError");
  
  if (form.password.value != form.password2.value) {
    regErr("Passwords must match.");
    return false;
  }
  
  function save_and_login() {
    blobVault.save();
    blobVault.login(user, pass, '', loginScreen.finishLogin, _.bind(regErr.text, regErr));
  }
  
  if (user && pass && (!form.pk.value || ncc.misc.isValidSeed(form.pk.value))) {
    blobVault.register(user, pass);
    ncc.user = localStorage.user = user;
    var seed = ncc.masterKey = blobVault.data.master_seed = (
       form.pk.value || Base58Utils.encode_base_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)))
    );
    ncc.accountID = blobVault.data.account_id = (new RippleAddress(seed)).getAddress();
    save_and_login();
  } else {
    regErr.text("Username and password can't be blank.");
  }
  return false;
};

$(document).ready(function () {
  var form = $("#registerForm").on('submit', registerScreen.onSubmit);

  form.find("input[name=username]").validateWithRegex(/./, "Good", "Bad");
  form.find("input[name=password]").passStrength({ userid: "#registerForm input[name=username]" });
  form.find("input[name=password2]").passEqual("#registerForm input[name=password]");
  form.find("input[name=pk]").validateWithFunction(ncc.misc.isValidSeed);
  
  form.find('input').on('input', function () {
    var nonEmpty = function () { return this.name == 'pk' || this.value.length; },
        allFilled = _.all(form.find('input:text,input:password').map(nonEmpty));
    form.find("input[type=submit]").attr('disabled', form.find("input+span.badPass").length || !allFilled);
  })
});