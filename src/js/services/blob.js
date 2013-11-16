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

  /**
   * Attempts to retrieve the blob.
   */
  BlobObj.get = function(url, id, callback)
  {
    if (url.indexOf("://") === -1) url = "http://" + url;

    $.ajax({
      url: url + '/blob/' + id,
      dataType: 'json',
      timeout: 8000
    })
      .success(function (data) {
        setImmediate(function () {
          $scope.$apply(function () {
            if (data.result === "success") {
              callback(null, data);
            } else {
              console.log(data);
              callback(new Error("Could not retrieve blob"));
            }
          });
        });
      })
      .error(webutil.getAjaxErrorHandler(callback, "BlobVault GET"));
  };

  /**
   * Attempts to retrieve and decrypt the blob.
   */
  BlobObj.init = function(url, id, crypt, callback)
  {
    BlobObj.get(url, id, function (err, data) {
      if (err) {
        callback(err);
        return;
      }

      var blob = BlobObj.decrypt(crypt, data.blob);

      if (blob) {
        callback(null, blob);
      } else {
        callback(new Error("Error while decrypting blob"));
      }
    });
  };

  BlobObj.create = function (url, id, crypt, account, secret, blob, callback)
  {
    $.ajax({
      type: "POST",
      url: url + '/blob/create',
      dataType: 'json',
      data: {
        blob_id: id,
        data: BlobObj.encrypt(crypt, blob),
        address: account,
        signature: "",
        pubkey: "",
        auth_secret: ""
      },
      timeout: 8000
    })
      .success(function (data) {
        setImmediate(function () {
          $scope.$apply(function () {
            if (data.result === "success") {
              callback(null, data);
            } else {
              callback(new Error("Could not create blob"));
            }
          });
        });
      })
      .error(webutil.getAjaxErrorHandler(callback, "BlobVault POST /blob/create"));
  };

  BlobObj.encrypt = function(key, bl)
  {
    // Filter Angular metadata before encryption
    if ('object' === typeof bl.data &&
        'object' === typeof bl.data.contacts)
      bl.data.contacts = angular.fromJson(angular.toJson(bl.data.contacts));

    key = sjcl.codec.hex.toBits(key);

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

    var hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(username + password));
    var encData = BlobObj.enc(username, password, bl);

    backends.forEach(function (backend) {
      backend.set(hash, encData, callback);
    });
  };

  BlobObj.decrypt = function (key, data)
  {
    try {
      key = sjcl.codec.hex.toBits(key);
      data = atob(data);

      var blob = new BlobObj();
      blob.data = JSON.parse(sjcl.decrypt(key, data));
      // TODO unescape is deprecated
      blob.meta = JSON.parse(unescape(JSON.parse(data).adata));
      return blob;
    } catch (e) {
      console.log("Blob decryption failed", e.toString());
      console.log(e.stack);
      return false;
    }
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
