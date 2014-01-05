/**
 * BLOB
 *
 * The old blob service that used to manage the user's private information.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('blob', []);

module.factory('rpBlob', ['$rootScope', '$http', function ($scope, $http)
{
  var BlobObj = function (url, id, key)
  {
    this.url = url;
    this.id = id;
    this.key = key;
    this.data = {};
    this.meta = {};
  };

  // Blob operations
  // You can APPEND new operations, otherwise DO NOT change this array.
  BlobObj.ops = {
    // Special
    "noop": 0,

    // Simple fields
    "set": 16,
    "delete": 17,

    // Array fields
    "push": 32,
    "pop": 33,
    "shift": 34,
    "unshift": 35,
    "filter": 36
  };

  BlobObj.opsReverseMap = [];
  $.each(BlobObj.ops, function (name, code) {
    BlobObj.opsReverseMap[code] = name;
  });

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

      var blob = new BlobObj(url, id, crypt);

      blob.revision = data.revision;

      if (!blob.decrypt(data.blob)) {
        callback(new Error("Error while decrypting blob"));
      }

      // Apply patches
      if ($.isArray(data.patches) && data.patches.length) {
        $.each(data.patches, function (i, patch) {
          blob.applyEncryptedPatch(patch);
        });

        blob.consolidate();
      }

      callback(null, blob);
    });
  };

  BlobObj.create = function (url, id, crypt, account, secret, callback)
  {
    var blob = new BlobObj(url, id, crypt);
    blob.revision = 0;
    blob.data = {
      master_seed: secret,
      account_id: account,
      contacts: []
    };
    blob.meta = {
      created: (new Date()).toJSON(),
      modified: (new Date()).toJSON()
    };

    $.ajax({
      type: "POST",
      url: url + '/blob/create',
      dataType: 'json',
      data: {
        blob_id: id,
        data: blob.encrypt(),
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
              callback(null, blob, data);
            } else {
              callback(new Error("Could not create blob"));
            }
          });
        });
      })
      .error(webutil.getAjaxErrorHandler(callback, "BlobVault POST /blob/create"));
  };

  BlobObj.prototype.encrypt = function()
  {
    // Filter Angular metadata before encryption
    if ('object' === typeof this.data &&
        'object' === typeof this.data.contacts)
      this.data.contacts = angular.fromJson(angular.toJson(this.data.contacts));

    var key = sjcl.codec.hex.toBits(this.key);

    return btoa(sjcl.encrypt(key, JSON.stringify(this.data), {
      iter: 1000,
      adata: JSON.stringify(this.meta),
      ks: 256
    }));
  };

  BlobObj.prototype.decrypt = function (data)
  {
    try {
      var key = sjcl.codec.hex.toBits(this.key);
      data = atob(data);

      this.data = JSON.parse(sjcl.decrypt(key, data));
      // TODO unescape is deprecated
      this.meta = JSON.parse(unescape(JSON.parse(data).adata));
      return this;
    } catch (e) {
      console.log("client: blob: decryption failed", e.toString());
      console.log(e.stack);
      return false;
    }
  };

  BlobObj.prototype.applyEncryptedPatch = function (patch)
  {
    try {
      var key = sjcl.codec.hex.toBits(this.key);
      var encryptedBits = sjcl.codec.base64.toBits(patch);

      var encrypted = {
        iv: sjcl.codec.base64.fromBits(sjcl.bitArray.bitSlice(encryptedBits, 0, 128)),
        ct: sjcl.codec.base64.fromBits(sjcl.bitArray.bitSlice(encryptedBits, 128)),
        adata: "",
        cipher: "aes",
        ks: 128,
        ts: 64,
        mode: "ccm",
        iter: 1000,
        v: 1
      };

      var params = JSON.parse(sjcl.decrypt(key, JSON.stringify(encrypted)));
      var op = params.shift();

      this.applyUpdate(op, params);

      this.revision++;

      return true;
    } catch (err) {
      console.log("client: blob: failed to apply patch:", err.toString());
      return false;
    }
  };

  BlobObj.prototype.consolidate = function (callback) {
    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    console.log("client: blob: consolidation at revision", this.revision);
    var encrypted = this.encrypt();

    $http({
      method: 'POST',
      url: this.url + '/blob/consolidate',
      responseType: 'json',
      data: {
        blob_id: this.id,
        data: encrypted,
        revision: this.revision
      }
    })
      .success(function(data, status, headers, config) {
        if (data.result === "success") {
          callback(null, data);
        } else {
          console.log("client: blob: could not consolidate:", data);
          callback(new Error("Failed to consolidate blob"));
        }
      })
      .error(function(data, status, headers, config) {
        console.log("client: blob: could not consolidate: "+status+" - "+data);

        // XXX Add better error information to exception
        callback(new Error("Failed to consolidate blob - XHR error"));
      });
  };

  /**
   * Set a field on an object using dot notation.
   *
   * This will recursively follow a path through an object to set a field on it.
   *
   * E.g. addValueToObj({}, "answers.universe_and_everything", 42)
   *       => {
   *            answers: {
   *              universe_and_everything: 42
   *            }
   *          }
   */
  function addValueToObj(obj, path, val) {
    // Separate each step in the "path"
    path = path.split(".");

    // Loop through each part of the path adding to obj
    for (var i = 0, tmp = obj; i < path.length - 1; i++) {
      tmp = tmp[path[i]] = ("undefined" === typeof tmp[path[i]]) ? {} : tmp[path[i]];
    }
    tmp[path[i]] = val;             // at the end of the chain add the value in

    return obj;
  }

  BlobObj.prototype.applyUpdate = function (op, params) {
    // XXX Convert from numeric op code to string
    if ("number" === typeof op) {
      op = BlobObj.opsReverseMap[op];
    }
    if ("string" !== typeof op) {
      throw new Error("Blob update op code must be a number or a valid op id string");
    }
    switch (op) {
    case "set":
      addValueToObj(this.data, params[0], params[1]);
      break;
    case "unshift":
      if ("undefined" === typeof this.data[params[0]]) {
        this.data[params[0]] = [];
      } else if (!Array.isArray(this.data[params[0]])) {
        throw new Error("Operator 'unshift' must be applied to an array.");
      }
      this.data[params[0]].unshift(params[1]);
      break;
    case "filter":
      if (!Array.isArray(this.data[params[0]])) {
        throw new Error("Operator 'unshift' must be applied to an array.");
      }
      this.data[params[0]].filter(function (entry) {
        return entry[params[1]] !== entry[params[2]];
      });
      break;
    default:
      throw new Error("Unsupported op "+op);
    }
  };

  BlobObj.prototype.postUpdate = function (op, params, callback) {
    // Callback is optional
    if ("function" !== typeof callback) callback = $.noop;

    if ("string" === typeof op) {
      op = BlobObj.ops[op];
    }
    if ("number" !== typeof op) {
      throw new Error("Blob update op code must be a number or a valid op id string");
    }
    if (op < 0 || op > 255) {
      throw new Error("Blob update op code out of bounds");
    }

    console.log("client: blob: submitting update", op, params);

    params.unshift(op);

    var key = sjcl.codec.hex.toBits(this.key);

    var encrypted = JSON.parse(sjcl.encrypt(key, JSON.stringify(params)));
    var iv = sjcl.codec.base64.toBits(encrypted.iv);
    var ct = sjcl.codec.base64.toBits(encrypted.ct);

    $http({
      method: 'POST',
      url: this.url + '/blob/patch',
      responseType: 'json',
      data: {
        blob_id: this.id,
        patch: sjcl.codec.base64.fromBits(sjcl.bitArray.concat(iv, ct))
      }
    })
      .success(function(data, status, headers, config) {
        if (data.result === "success") {
          console.log("client: blob: saved patch as revision", data.revision);
          callback(null, data);
        } else {
          console.log("client: blob: could not save patch:", data);
          callback(new Error("Patch could not be saved - bad result"));
        }
      })
      .error(function(data, status, headers, config) {
        console.log("client: blob: could not save patch: "+status+" - "+data);
        callback(new Error("Patch could not be saved - XHR error"));
      });
  };

  BlobObj.prototype.set = function (key, value, callback) {
    this.applyUpdate('set', [key, value]);
    this.postUpdate('set', [key, value], callback);
  };

  /**
   * Prepend an entry to an array.
   *
   * This method adds an entry to the beginning of an array.
   */
  BlobObj.prototype.unshift = function (key, value, callback) {
    if (!Array.isArray(this.data[key])) {
      throw new Error("Tried to prepend (unshift) data to a non-array");
    }
    this.applyUpdate('unshift', [key, value]);
    this.postUpdate('unshift', [key, value], callback);
  };

  /**
   * Filter the row(s) from an array.
   *
   * This method will remove any entries from the array stored under `key` where
   * the field with the name `field` equals `value`.
   */
  BlobObj.prototype.filter = function (key, field, value, callback) {
    if (!Array.isArray(this.data[key])) {
      throw new Error("Tried to filter data from a non-array");
    }
    this.applyUpdate('filter', [key, field, value]);
    this.postUpdate('filter', [key, field, value], callback);
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
