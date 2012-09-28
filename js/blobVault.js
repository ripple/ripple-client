var blobVault = new (function () {
  var user = '',
      pass = '',
      key = '';
  
  if (!localStorage.blobs) { localStorage.blobs = '{}'; }
  
  function make_key() {
    return sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(user + pass));
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
  
  this.login = function (username, password, offlineBlob, onSuccess) {
    user = username;
    pass = password;
    key = make_key(user, pass);
    
    var blobs = JSON.parse(localStorage.blobs);
    
    if (offlineBlob) {
      if (this.loadBlob(offlineBlob)) {
        this.save();
        this.pushToServer();
        onSuccess();
      } else {
        throw "Account decryption failed.";
      }
    } else {
      function processBlob(serverBlob, status) {
        var localBlob = blobs[key] || '';
        
        // if server is down, or has blob same as local, just use local
        if (status != 'success' || serverBlob == localBlob) {
          if (localBlob) {
            if (blobVault.loadBlob(localBlob)) {
              onSuccess();
            } else {
              throw "Account decryption failed.";
            }
          } else {
            throw "Unknown username or bad password.";
          }
        }
        
        var blob = (serverBlob && localBlob) ? newer_blob(serverBlob, localBlob)
                                             : serverBlob || localBlob;
        
        if (blob == serverBlob) {
          if (blobVault.loadBlob(blob)) {
            blobVault.save();
          } else {
            blobVault.loadBlob(localBlob) && blobVault.pushToServer();
          }
        } else {
          if (blobVault.loadBlob(localBlob)) {
            blobVault.pushToServer();
          } else {
            blobVault.loadBlob(serverBlob) && blobVault.save();
          }
        }
        
        if (blobVault.blob) {
          onSuccess();
        } else {
          throw "Account decryption failed.";
        }
      }
      
      $.get('http://' + BLOBVAULT_SERVER + '/' + key)
        .success(processBlob)
        .error(processBlob);
    }
  };
  
  this.loadBlob = function (blob) {
    try {
      this.data = JSON.parse(sjcl.decrypt(user + pass, atob(blob)));
      this.meta = JSON.parse(unescape(JSON.parse(atob(blob)).adata));
      this.blob = blob;
      return true;
    } catch (e) {
      return false;
    }
  }
  
  this.register = function (username, password) {
    user = username;
    pass = password;
    key = make_key(user, pass);
    this.data = {};
    this.meta = {
      created: (new Date()).toJSON()
    };
  };
  
  this.save = function () {
    var blobs = JSON.parse(localStorage.blobs),
        plaintext = JSON.stringify(this.data),
        adata;
    
    this.meta.modified = (new Date()).toJSON();
    adata = JSON.stringify(this.meta);
    
    this.blob = blobs[key] = btoa(sjcl.encrypt(user + pass, plaintext, { iter: 1000, adata: adata }));
    
    localStorage.blobs = JSON.stringify(blobs);
  };
  
  this.pushToServer = function () {
    $.post('http://' + BLOBVAULT_SERVER + '/' + key, { blob: this.blob });
  }
  
  this.logout = function () {
    delete user;
    delete pass;
    delete key;
    this.blob = '';
    this.data = {};
    this.meta = {};
  }
})();
