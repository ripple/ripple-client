var webutil = require("./webutil"),
    log = require("./log");

var BlobObj = function ()
{
  this.data = {};
  this.meta = {};
};

function processBackendsParam(backends)
{
  if (!Array.isArray(backends)) {
    backends = [backends];
  }

  backends = backends.map(function (backend) {
    if ("string" === typeof backend) {
      return BlobObj.backends[backend];
    } else {
      return backend;
    }
  });

  return backends;
}

/**
 * Attempts to retrieve the blob from the specified backend.
 */
BlobObj.get = function(backends, user, pass, callback)
{
  backends = processBackendsParam(backends);

  var backend = backends.shift();
  console.log('backend', backend);
  var key = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(user + pass));
  try {
    backend.get(key, function (err, data) {
      if (err) {
        console.warn("Backend failed: ", err);
        log.exception(err);
      }

      var blob;
      if (data && !err) {
        blob = BlobObj.decrypt(user+pass, atob(data));
        callback(null, blob);
      } else tryNext();
    });
  } catch (e) {
    console.warn("Backend failed: ", e);
    log.exception(e);
    tryNext();
  }

  function tryNext() {
    console.log(backends.length);
    // Do we have more backends to try?
    if (backends.length) {
      BlobObj.get(backends, user, pass, callback);
    } else {
      callback(new Error("Unable to load blob, all backends failed."));
    }
  }
};

BlobObj.enc = function(username,password,bl)
{
  return btoa(sjcl.encrypt(username + password, JSON.stringify(bl.data), {
    iter: 1000,
    adata: JSON.stringify(bl.meta),
    ks: 256
  }));
}

BlobObj.set = function(backends, username, password, bl, callback)
{
  backends = processBackendsParam(backends);

  var hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(username + password));
  var encData = BlobObj.enc(username, password, bl);

  backends.forEach(function (backend) {
    backend.set(hash, encData, callback);
  });
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
    var url = Options.blobvault;
    if (url.indexOf("://") === -1) url = "http://" + url;
    $.get(url + '/' + key)
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
  get: function (key, callback)
  {
    console.log('local get','ripple_blob_' + key);
    var blob = store.get('ripple_blob_'+key);
    callback(null, blob);
  },

  set: function (key, value, callback)
  {
    store.set('ripple_blob_'+key, value);
    callback();
  }
};

BlobObj.backends = {
  vault: VaultBlobBackend,
  local: LocalBlobBackend
};

exports.VaultBlobBackend = VaultBlobBackend;
exports.LocalBlobBackend = LocalBlobBackend;
exports.BlobObj = BlobObj;
exports.get = BlobObj.get;
