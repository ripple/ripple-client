var blobVault = new (function () {
  var user, pass, key;
  
  if (!localStorage.blobs) {
    localStorage.blobs = '{}';
  }
  
  function make_key(u, p) {
    return sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(u + p));
  }
  
  this.blob = '';
  this.data = {};
  this.meta = {};
  
  this.login = function (username, password, offlineBlob, callback) {
    user = username;
    pass = password;
    key = make_key(user, pass);
    
    var blobs = JSON.parse(localStorage.blobs);
    
    if (offlineBlob || key in blobs) {
      this.blob = offlineBlob || blobs[key];
      try {
        this.data = JSON.parse(sjcl.decrypt(user + pass, atob(this.blob)));
        this.meta = JSON.parse(unescape(JSON.parse(atob(this.blob)).adata));
        if (offlineBlob) this.save();
      } catch (e) {
        // decryption fails silently, but caller can check this.data.master_seed
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
    
    this.blob = blobs[key] = btoa(sjcl.encrypt(user + pass, plaintext, { iter: 10000, adata: adata }));
    localStorage.blobs = JSON.stringify(blobs);
  };
  
  this.logout = function () {
    delete user;
    delete pass;
    delete key;
    this.blob = '';
    this.data = {};
    this.meta = {};
  }
})();
