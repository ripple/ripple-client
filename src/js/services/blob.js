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
              var blobObj = new BlobObj();
              blobObj.data = blob.data;
              blobObj.meta = blob.meta;
              callback(null, blobObj, data);
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
      throw new Error("Not implemented");
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

  BlobObj.prototype.postUpdate = function (op, params) {
    if ("string" === typeof op) {
      op = BlobObj.ops[op];
    }
    if ("number" !== typeof op) {
      throw new Error("Blob update op code must be a number or a valid op id string");
    }
    if (op < 0 || op > 255) {
      throw new Error("Blob update op code out of bounds");
    }

    params.unshift(op);

    console.log(JSON.stringify(params));
  };

  BlobObj.prototype.set = function (key, value) {
    this.applyUpdate('set', [key, value]);
    this.postUpdate('set', [key, value]);
  };

  /**
   * Prepend an entry to an array.
   *
   * This method adds an entry to the beginning of an array.
   */
  BlobObj.prototype.unshift = function (key, value) {
    if (!Array.isArray(this.data[key])) {
      throw new Error("Tried to prepend (unshift) data to a non-array");
    }
    this.applyUpdate('unshift', [key, value]);
    this.postUpdate('unshift', [key, value]);
  };

  /**
   * Filter the row(s) from an array.
   *
   * This method will remove any entries from the array stored under `key` where
   * the field with the name `field` equals `value`.
   */
  BlobObj.prototype.filter = function (key, field, value) {
    if (!Array.isArray(this.data[key])) {
      throw new Error("Tried to filter data from a non-array");
    }
    this.applyUpdate('filter', [key, field, value]);
    this.postUpdate('filter', [key, field, value]);
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
