/**
 * BLOB
 *
 * The old blob service that used to manage the user's private information.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('blob', []);

module.factory('rpBlob', ['$rootScope', function ($scope)
{
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

  BlobObj.exists = function (id, callback) {
    
  };

  /**
   * Attempts to retrieve the blob.
   */
  BlobObj.get = function(id, callback)
  {
    
  };

  BlobObj.enc = function(username,password,bl)
  {
    // filter out contacts before they are encrypted
    if (typeof(bl.data.contacts) === 'object')
      bl.data.contacts = angular.fromJson(angular.toJson(bl.data.contacts));

    var key = ""+username.length+'|'+username+password;
    return btoa(sjcl.encrypt(key, JSON.stringify(bl.data), {
      iter: 1000,
      adata: JSON.stringify(bl.meta),
      ks: 256
    }));
  };

  BlobObj.patch = function(id, auth_secret, diff, callback)
  {
    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    backends = processBackendsParam(backends);

    var hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(username + password));
    var encData = BlobObj.enc(username, password, bl);

    backends.forEach(function (backend) {
      backend.set(hash, encData, callback);
    });
  };

  BlobObj.decrypt = function (user, pass, data)
  {
    function decrypt(priv, ciphertext)
    {
      var blob = new BlobObj();
      blob.data = JSON.parse(sjcl.decrypt(priv, ciphertext));
      // TODO unescape is deprecated
      blob.meta = JSON.parse(unescape(JSON.parse(ciphertext).adata));
      return blob;
    }

    var key;
    try {
      // Try new-style key
      key = ""+user.length+'|'+user+pass;
      return decrypt(key, atob(data));
    } catch (e1) {
      console.log("Blob decryption failed with new-style key:", e1.toString());
      try {
        // Try old style key
        key = user+pass;
        var blob = decrypt(key, atob(data));
        blob.old = true;
        return blob;
      } catch (e2) {
        console.log("Blob decryption failed with old-style key:", e2.toString());
        return false;
      }
    }
  };

  var VaultBlobBackend = {
    name: "Payward",

    get: function (key, callback) {
      var url = Options.blobvault;

      if (url.indexOf("://") === -1) url = "http://" + url;

      $.ajax({
        url: url + '/' + key,
        timeout: 8000
      })
        .success(function (data) {
          callback(null, data);
        })
        .error(webutil.getAjaxErrorHandler(callback, "BlobVault GET"));
    },

    set: function (key, value, callback) {
      var url = Options.blobvault;

      if (url.indexOf("://") === -1) url = "http://" + url;

      $.post(url + '/' + key, { blob: value })
        .success(function (data) {
          callback(null, data);
        })
        .error(webutil.getAjaxErrorHandler(callback, "BlobVault SET"));
    }
  };

  var LocalBlobBackend = {
    name: "Local browser",

    get: function (key, callback)
    {
      console.log('local get','ripple_blob_' + key);
      var blob = store.get('ripple_blob_'+key);
      // We use a timeout to simulate this function being asynchronous
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

  function BlobError(message, backend) {
    this.name = "BlobError";
    this.message = message || "";
    this.backend = backend || "generic";
  }

  BlobError.prototype = Error.prototype;

  BlobObj.BlobError = BlobError;

  return BlobObj;
}]);
