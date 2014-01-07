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
  };

  // Blob operations
  // Do NOT change the mapping of existing ops
  BlobObj.ops = {
    // Special
    "noop": 0,

    // Simple ops
    "set": 16,
    "unset": 17,
    "extend": 18,

    // Meta ops
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
        var successful = true;
        $.each(data.patches, function (i, patch) {
          successful = successful && blob.applyEncryptedPatch(patch);
        });

        if (successful) blob.consolidate();
      }

      callback(null, blob);
    });
  };

  BlobObj.create = function (url, id, crypt, unlock, account, secret, callback)
  {
    var blob = new BlobObj(url, id, crypt);
    blob.revision = 0;
    blob.data = {
      encrypted_secret: blob.encryptSecret(unlock, secret),
      account_id: account,
      contacts: [],
      created: (new Date()).toJSON()
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

  var cryptConfig = {
    cipher: "aes",
    mode: "ccm",
    // tag length
    ts: 64,
    // key size
    ks: 256,
    // iterations (key derivation)
    iter: 1000
  };

  function encrypt(key, data)
  {
    key = sjcl.codec.hex.toBits(key);

    var opts = $.extend({}, cryptConfig);

    var encryptedObj = JSON.parse(sjcl.encrypt(key, data, opts));
    var version = [sjcl.bitArray.partial(8, 0)];
    var initVector = sjcl.codec.base64.toBits(encryptedObj.iv);
    var ciphertext = sjcl.codec.base64.toBits(encryptedObj.ct);

    var encryptedBits = sjcl.bitArray.concat(version, initVector);
    encryptedBits = sjcl.bitArray.concat(encryptedBits, ciphertext);

    return sjcl.codec.base64.fromBits(encryptedBits);
  }

  function decrypt(key, data)
  {
    key = sjcl.codec.hex.toBits(key);
    var encryptedBits = sjcl.codec.base64.toBits(data);

    var version = sjcl.bitArray.extract(encryptedBits, 0, 8);

    if (version !== 0) {
      throw new Error("Unsupported encryption version: "+version);
    }

    var encrypted = $.extend({}, cryptConfig, {
      iv: sjcl.codec.base64.fromBits(sjcl.bitArray.bitSlice(encryptedBits, 8, 8+128)),
      ct: sjcl.codec.base64.fromBits(sjcl.bitArray.bitSlice(encryptedBits, 8+128))
    });

    return sjcl.decrypt(key, JSON.stringify(encrypted));
  }

  BlobObj.prototype.encrypt = function()
  {
    // Filter Angular metadata before encryption
    if ('object' === typeof this.data &&
        'object' === typeof this.data.contacts)
      this.data.contacts = angular.fromJson(angular.toJson(this.data.contacts));

    var key = sjcl.codec.hex.toBits(this.key);

    return encrypt(this.key, JSON.stringify(this.data));
  };

  BlobObj.prototype.decrypt = function (data)
  {
    try {
      this.data = JSON.parse(decrypt(this.key, data));
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
      var params = JSON.parse(decrypt(this.key, patch));
      var op = params.shift();
      var path = params.shift();

      this.applyUpdate(op, path, params);

      this.revision++;

      return true;
    } catch (err) {
      console.log("client: blob: failed to apply patch:", err.toString());
      console.log(err.stack);
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

  BlobObj.escapeToken = function (token) {
    return token.replace(/[~\/]/g, function (key) { return key === "~" ? "~0" : "~1"; });
  };
  BlobObj.prototype.escapeToken = BlobObj.escapeToken;

  var unescapeToken = function(str) {
    return str.replace(/~./g, function(m) {
      switch (m) {
      case "~0":
        return "~";
      case "~1":
        return "/";
      }
      throw("Invalid tilde escape: " + m);
    });
  };

  BlobObj.prototype.applyUpdate = function (op, path, params) {
    // Convert from numeric op code to string
    if ("number" === typeof op) {
      op = BlobObj.opsReverseMap[op];
    }
    if ("string" !== typeof op) {
      throw new Error("Blob update op code must be a number or a valid op id string");
    }

    // Separate each step in the "pointer"
    var pointer = path.split("/");

    var first = pointer.shift();
    if (first !== "") {
      throw new Error("Invalid JSON pointer");
    }

    this._traverse(this.data, pointer, path, op, params);
  };

  BlobObj.prototype._traverse = function (context, pointer,
                                          originalPointer, op, params) {
    var _this = this;
    var part = unescapeToken(pointer.shift());

    if (Array.isArray(context)) {
      if (part === '-') {
        part = context.length;
      } else if (part % 1 !== 0 && part >= 0) {
        throw new Error("Invalid pointer, array element segments must be " +
                        "a positive integer, zero or '-'");
      }
    } else if ("object" !== typeof context) {
      return null;
    } else if (!context.hasOwnProperty(part)) {
      // Some opcodes create the path as they're going along
      if (op === "set") {
        context[part] = {};
      } else if (op === "unshift") {
        context[part] = [];
      } else {
        return null;
      }
    }

    if (pointer.length !== 0) {
      return this._traverse(context[part], pointer,
                            originalPointer, op, params);
    }

    switch (op) {
    case "set":
      context[part] = params[0];
      break;
    case "unset":
      if (Array.isArray(context)) {
        context.splice(part, 1);
      } else {
        delete context[part];
      }
      break;
    case "extend":
      if ("object" !== typeof context[part]) {
        throw new Error("Tried to extend a non-object");
      }
      $.extend(context[part], params[0]);
      break;
    case "unshift":
      if ("undefined" === typeof context[part]) {
        context[part] = [];
      } else if (!Array.isArray(context[part])) {
        throw new Error("Operator 'unshift' must be applied to an array.");
      }
      context[part].unshift(params[0]);
      break;
    case "filter":
      if (Array.isArray(context[part])) {
        context[part].forEach(function (element, i) {
          if ("object" === typeof element &&
              element.hasOwnProperty(params[0]) &&
              element[params[0]] === params[1]) {
            var subpointer = originalPointer+"/"+i;
            var subcommands = normalizeSubcommands(params.slice(2));

            subcommands.forEach(function (subcommand) {
              var op = subcommand[0];
              var pointer = subpointer+subcommand[1];
              _this.applyUpdate(op, pointer, subcommand.slice(2));
            });
          }
        });
      }
      break;
    default:
      throw new Error("Unsupported op "+op);
    }
  };

  BlobObj.prototype.postUpdate = function (op, pointer, params, callback) {
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

    params.unshift(pointer);
    params.unshift(op);
 
    $http({
      method: 'POST',
      url: this.url + '/blob/patch',
      responseType: 'json',
      data: {
        blob_id: this.id,
        patch: encrypt(this.key, JSON.stringify(params))
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

  BlobObj.prototype.set = function (pointer, value, callback) {
    this.applyUpdate('set', pointer, [value]);
    this.postUpdate('set', pointer, [value], callback);
  };

  BlobObj.prototype.unset = function (pointer, callback) {
    this.applyUpdate('unset', pointer, []);
    this.postUpdate('unset', pointer, [], callback);
  };

  BlobObj.prototype.extend = function (pointer, value, callback) {
    this.applyUpdate('extend', pointer, [value]);
    this.postUpdate('extend', pointer, [value], callback);
  };

  /**
   * Prepend an entry to an array.
   *
   * This method adds an entry to the beginning of an array.
   */
  BlobObj.prototype.unshift = function (pointer, value, callback) {
    this.applyUpdate('unshift', pointer, [value]);
    this.postUpdate('unshift', pointer, [value], callback);
  };

  function normalizeSubcommands(subcommands, compress) {
    // Normalize parameter structure
    if ("number" === typeof subcommands[0] ||
        "string" === typeof subcommands[0]) {
      // Case 1: Single subcommand inline
      subcommands = [subcommands];
    } else if (subcommands.length === 1 &&
               Array.isArray(subcommands[0]) &&
               ("number" === typeof subcommands[0][0] ||
                "string" === typeof subcommands[0][0])) {
      // Case 2: Single subcommand as array
      // (nothing to do)
    } else if (Array.isArray(subcommands[0])) {
      // Case 3: Multiple subcommands as array of arrays
      subcommands = subcommands[0];
    }

    // Normalize op name and convert strings to numeric codes
    subcommands = subcommands.map(function (subcommand) {
      if ("string" === typeof subcommand[0]) {
        subcommand[0] = BlobObj.ops[subcommand[0]];
      }
      if ("number" !== typeof subcommand[0]) {
        throw new Error("Invalid op in subcommand");
      }
      if ("string" !== typeof subcommand[1]) {
        throw new Error("Invalid path in subcommand");
      }
      return subcommand;
    });

    if (compress) {
      // Convert to the minimal possible format
      if (subcommands.length === 1) {
        return subcommands[0];
      } else {
        return [subcommands];
      }
    } else {
      return subcommands;
    }
  }

  /**
   * Filter the row(s) from an array.
   *
   * This method will find any entries from the array stored under `pointer` and
   * apply the `subcommands` to each of them.
   *
   * The subcommands can be any commands with the pointer parameter left out.
   */
  BlobObj.prototype.filter = function (pointer, field, value, subcommands, callback) {
    var params = Array.prototype.slice.apply(arguments);
    if ("function" === typeof params[params.length-1]) {
      callback = params.pop();
    }
    params.shift();

    // Normalize subcommands to minimize the patch size
    params = params.slice(0, 2).concat(normalizeSubcommands(params.slice(2), true));

    this.applyUpdate('filter', pointer, params);
    this.postUpdate('filter', pointer, params, callback);
  };

  BlobObj.prototype.decryptSecret = function (secretUnlockKey) {
    return decrypt(secretUnlockKey, this.data.encrypted_secret);
  };

  BlobObj.prototype.encryptSecret = function (secretUnlockKey, secret) {
    return encrypt(secretUnlockKey, secret);
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
