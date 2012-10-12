var blobVault = new (function () {
  var user = '',
      pass = '',
      hash = '';
  
  if (!localStorage.blobs) { localStorage.blobs = '{}'; }
  var blobs = JSON.parse(localStorage.blobs);
  
  function make_hash() {
    return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(user + pass));
  }
  
  function newer_blob(b1, b2) {
    function blob_modified(b) {
      try { return JSON.parse(unescape(JSON.parse(atob(b)).adata)).modified; }
      catch (e) { return ''; }
    }
    return blob_modified(b1) > blob_modified(b2) ? b1 : b2;
  }
  
  this.blob = '';
  this.data = {};
  this.meta = {};
  
  this.login = function (username, password, offlineBlob, onSuccess, onFailure) {
    user = username;
    pass = password;
    hash = make_hash(user, pass);
    
    function processBlob(blob) {
      if (!blob) onFailure("Unknown username or bad password.");
      else if (!blobVault.loadBlob(blob)) onFailure("Account decryption failed.");
      else onSuccess();
    }
    
    function processServerBlob(serverBlob) {
      var localBlob = blobs[hash] || "",
          serverBlob = serverBlob || "";
      
      if (offlineBlob) {
        if (this.loadBlob(offlineBlob)) {
          this.save();
          this.pushToServer(serverBlob);
          onSuccess();
        } else {
          onFailure("Account decryption failed.");
        }
        return;
      }
      
      if (serverBlob == localBlob) {
        processBlob(localBlob);
        return;
      }
      
      var primaryBlob = (serverBlob && localBlob) ? newer_blob(serverBlob, localBlob)
                                                  : serverBlob || localBlob;
      
      // next, we try to load the primary blob selected above...
      // if successful, we overwrite the secondary blob which wasn't selected with it
      // if unsuccessful (i.e. someone modified the primary blob), we try to load the
      //   secondary blob, and, if successful, overwrite the primary one with it
      if (primaryBlob == serverBlob) {
        console.log("server blob is primary");
        if (blobVault.loadBlob(serverBlob)) {
          console.log("overwriting local blob");
          blobVault.write_blob(serverBlob);
        } else {
          blobVault.loadBlob(localBlob) && blobVault.pushToServer(serverBlob);
        }
      } else {
        console.log("local is primary");
        if (blobVault.loadBlob(localBlob)) {
          console.log("overwriting server");
          blobVault.pushToServer(serverBlob);
        } else {
          if (blobVault.loadBlob(serverBlob)) {
            blobVault.write_blob(serverBlob);
          }
        }
      }
      
      // blobVault.blob is truthy iff a loadBlob succeeded
      if (blobVault.blob) {
        onSuccess();
      } else {
        onFailure("Account decryption failed.");
      }
    }
    
    $.get('http://' + Options.BLOBVAULT_SERVER + '/' + hash)
      .success(processServerBlob)
      .error(function () {
        processBlob(blobs[hash]);
      });
  };
  
  this.loadBlob = function (blob) {
    var b = atob(blob);
    try {
      this.data = JSON.parse(sjcl.decrypt(user + pass, b));
      this.meta = JSON.parse(unescape(JSON.parse(b).adata));
      this.blob = blob;
      if (!this.data.address_to_name) this.data.address_to_name = {};
      if (!this.data.name_to_address) this.data.name_to_address = {};
      if (!this.data.recent_sends) this.data.recent_sends = [];
      return true;
    } catch (e) {
      return false;
    }
  }
  
  this.register = function (username, password) {
    user = username;
    pass = password;
    hash = make_hash(user, pass);
    this.data = {};
    this.meta = {
      created: (new Date()).toJSON()
    };
  };
  
  this.save = function () {
    var plaintext = JSON.stringify(this.data),
        adata, ct, key;
    
    this.meta.modified = (new Date()).toJSON();
    adata = JSON.stringify(this.meta);
    ct = sjcl.encrypt(user + pass, plaintext, { iter: 1000, adata: adata, ks: 256 });
    this.write_blob(btoa(ct));
  };
  
  this.write_blob = function (blob) {
    this.blob = blobs[hash] = blob;
    localStorage.blobs = JSON.stringify(blobs);
  }
  
  function pbkdfParams(blob) {
    var b = JSON.parse(atob(blob));
    return {
      salt: b.salt && sjcl.codec.base64.toBits(b.salt),
      iter: b.iter
    };
  }
  
  function authBlobUpdate(phrase, oldBlob, newBlob) {
    var curve = sjcl.ecc.curves.c192,
        
        ecdsaKey = new sjcl.ecc.ecdsa.secretKey(curve,
          sjcl.bn.fromBits(
            sjcl.misc.cachedPbkdf2(phrase, pbkdfParams(oldBlob)).key
          ).mod(curve.r)
        ),
        
        sig = ecdsaKey.sign(sjcl.hash.sha256.hash(newBlob)),
        
        pub = curve.G.mult(
          sjcl.bn.fromBits(
            sjcl.misc.cachedPbkdf2(phrase, pbkdfParams(newBlob)).key
          ).mod(curve.r)
        );
        
    return {
      new_pub: sjcl.codec.base64.fromBits(pub.toBits()),
      sig: sjcl.codec.base64.fromBits(sig),
      blob: newBlob
    }
  }
  
  this.pushToServer = function (oldBlob) {
    var data = oldBlob ? authBlobUpdate(user + pass, oldBlob, this.blob)
                       : { blob: this.blob };
    
    $.post('http://' + Options.BLOBVAULT_SERVER + '/' + hash, data);
  }
  
  this.logout = function () {
    delete user;
    delete pass;
    delete hash;
    this.blob = '';
    this.data = {};
    this.meta = {};
  }
  
  // accessors for blobVault.data
  
  this.getRecentSends = function () {
    return _.object(
      blobVault.data.recent_sends,
      _.map(
        blobVault.data.recent_sends || [],
        function (a) { return blobVault.addressBook.getName(a) || a; }
      )
    );
  };
  
  this.addressBook = {
    setEntry : function (name, address) {
      blobVault.data.address_to_name[address] = name;
      blobVault.data.name_to_address[name] = address;
    },
    
    getAddress : function (name) {
      return blobVault.data.name_to_address[name];
    },
    
    getName : function (address) {
      return blobVault.data.address_to_name[address];
    }
  };
})();
