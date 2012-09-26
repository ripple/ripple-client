var blobVault = new (function () {
  var user, pass;
  
  if (!localStorage.blobs) {
    localStorage.blobs = '{}';
  }
  
  function make_key(u, p) {
    return sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(u + p));
  }
  
  this.data = {};
  this.meta = {};
  
  this.authenticate = function (username, password, callback) {
    user = username;
    pass = password;
    
    var blobs = JSON.parse(localStorage.blobs);
    key = make_key(user, pass);
    
    if (key in blobs) {
      try {
        this.data = JSON.parse(sjcl.decrypt(user + pass, JSON.stringify(blobs[key])));
        this.meta = JSON.parse(unescape(blobs[key].adata));
      } catch (e) { 
        // decryption fails silently
      }
      callback(true);
    } else {
      callback(false);
    }
  };
  
  this.register = function (username, password, callback) {
    user = username;
    pass = password;
    this.data = {};
    this.meta = {};
    this.save();
  };
  
  this.save = function () {
    var blobs = JSON.parse(localStorage.blobs),
        key = make_key(user, pass),
        plaintext = JSON.stringify(this.data),
        adata = JSON.stringify(this.meta);
    
    blobs[key] = JSON.parse(sjcl.encrypt(user + pass, plaintext, { iter: 10000, adata: adata }));
    localStorage.blobs = JSON.stringify(blobs);
  };
  
  this.logout = function () {
    delete user;
    delete pass;
    this.data = {};
    this.meta = {};
  }
})();
