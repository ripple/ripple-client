var webutil = require("./webutil");

var BlobObj = function ()
{
  this.data = {};
  this.meta = {};
};

/**
 * Attempts to retrieve the blob from the specified backend.
 */
BlobObj.get = function(backend, user, pass, callback)
{
  if ("string" === typeof backend) {
    backend = BlobObj.backends[backend];
  }

  var key = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(user + pass));
  backend.get(key, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var blob;
    if (data) {
      blob = BlobObj.decrypt(user+pass, atob(data));
    } else {
      blob = new BlobObj();
    }
    callback(null, blob);
  });
};

BlobObj.enc = function(username,password,bl)
{
  return btoa(sjcl.encrypt(username + password, JSON.stringify(bl.data), {
    iter: 1000,
    adata: JSON.stringify(bl.meta),
    ks: 256
  }));
}

BlobObj.set = function(backend, username, password, bl, callback)
{
  // TODO code duplication. see BlobObj.get
  if ("string" === typeof backend) {
    backend = BlobObj.backends[backend];
  }

  var hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(username + password));

  backend.set(hash, this.enc(username,password,bl), callback);
};

BlobObj.decrypt = function (priv, ciphertext)
{
  var blob = new BlobObj();
  blob.data = JSON.parse(sjcl.decrypt(priv, ciphertext));
  // TODO unescape is deprecated
  blob.meta = JSON.parse(unescape(JSON.parse(ciphertext).adata));
  return blob;
};

var VaultBlobBackend = {
  get: function (key, callback)
  {
    $.get(Options.blobvault + '/' + key)
        .success(function (data) {
          callback(null, data);
        })
        .error(webutil.getAjaxErrorHandler(callback, "BlobVault GET"));
  },

  set: function (key, value, callback)
  {
    $.post('http://' + Options.blobvault + '/' + key, { blob: value })
        .success(function (data) {
          callback(null, data);
        })
        .error(webutil.getAjaxErrorHandler(callback, "BlobVault SET"));
  }
};

var LocalBlobBackend = {
  // stub
};

BlobObj.backends = {
  vault: VaultBlobBackend,
  local: LocalBlobBackend
};

exports.VaultBlobBackend = VaultBlobBackend;
exports.LocalBlobBackend = LocalBlobBackend;
exports.BlobObj = BlobObj;
exports.get = BlobObj.get;
