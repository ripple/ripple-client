/**
 * BLOB
 *
 * User blob storage for desktop client
 */

var fs = require("fs");

var module = angular.module('blob', []);

module.factory('rpBlob', ['$rootScope', '$http', function ($scope, $http)
{
  var cryptConfig = {
    // key size
    ks: 256,
    // iterations (key derivation)
    iter: 1000
  };

  var BlobObj = function (password)
  {
    this.password = password;
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
  BlobObj.get = function(walletfile, callback)
  {
    fs.readFile(walletfile, 'utf8', function(err, data){
      if (err) {
        callback(err);
        return;
      }

      callback(null, data);
    });
  };

  /**
   * Attempts to retrieve and decrypt the blob.
   */
  BlobObj.init = function(walletfile, password, callback)
  {
    BlobObj.get(walletfile, function (err, data) {
      if (err) {
        callback(err);
        return;
      }

      var blob = new BlobObj(password);
      var decryptedBlob = blob.decrypt(data);

      if (!decryptedBlob) {
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

      callback(null, decryptedBlob);
    });
  };

  /**
   * Create a blob object
   *
   * @param {object} opts
   * @param {string} opts.url
   * @param {string} opts.id
   * @param opts.crypt
   * @param opts.unlock
   * @param {string} opts.username
   * @param {string} opts.account
   * @param {string} opts.masterkey
   * @param {object=} opts.oldUserBlob
   * @param {function} callback
   */
  BlobObj.create = function (opts, callback)
  {
    var blob = new BlobObj(opts.password);
    blob.revision = 0;
    blob.data = {
      masterkey: opts.masterkey,
      account_id: opts.account,
      contacts: [],
      created: (new Date()).toJSON()
    };

    // Store blob in a file
    fs.writeFile(opts.walletfile, blob.encrypt(), function(){
      callback(null, blob);
    });
  };

  BlobObj.prototype.encrypt = function()
  {
    // Filter Angular metadata before encryption
    if ('object' === typeof this.data &&
        'object' === typeof this.data.contacts)
      this.data.contacts = angular.fromJson(angular.toJson(this.data.contacts));

    // Encryption
    return btoa(sjcl.encrypt(""+this.password.length+'|'+this.password,
      JSON.stringify(this.data), {
        ks: cryptConfig.ks,
        iter: cryptConfig.iter
      }
    ));
  };

  BlobObj.prototype.decrypt = function (data)
  {
    try {
      function decrypt(priv, ciphertext)
      {
        var blob = new BlobObj();
        blob.data = JSON.parse(sjcl.decrypt(priv, ciphertext));
        return blob;
      }

      return decrypt(""+this.password.length+'|'+this.password, atob(data));
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

    var config = {
      method: 'POST',
      url: this.url + '/blob/consolidate',
      responseType: 'json',
      data: {
        blob_id: this.id,
        data: encrypted,
        revision: this.revision
      }
    };

    /*$http(this.signRequest(config))
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
      });*/
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
    // Exchange from numeric op code to string
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
      throw new Error("Invalid JSON pointer: "+path);
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

  var dateAsIso8601 = (function () {
    function pad(n) {
      return (n < 0 || n > 9 ? "" : "0") + n;
    }

    return function dateAsIso8601() {
      var date = new Date();
      return date.getUTCFullYear() + "-"
        + pad(date.getUTCMonth() + 1) + "-"
        + pad(date.getUTCDate()) + "T"
        + pad(date.getUTCHours()) + ":"
        + pad(date.getUTCMinutes()) + ":"
        + pad(date.getUTCSeconds()) + ".000Z";
    };
  })();

  BlobObj.prototype.signRequest = function (config) {
    config = $.extend({}, config);

    // XXX This method doesn't handle signing GET requests correctly. The data
    //     field will be merged into the search string, not the request body.

    // Parse URL
    var parser = document.createElement('a');
    parser.href = config.url;

    // Sort the properties of the JSON object into canonical form
    var canonicalData = JSON.stringify(copyObjectWithSortedKeys(config.data));

    // Canonical request using Amazon's v4 signature format
    // See: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
    var canonicalRequest = [
      config.method || 'GET',
      parser.pathname || '',
      parser.search || '',
      // XXX Headers signing not supported
      '',
      '',
      sjcl.codec.hex.fromBits(sjcl.hash.sha512.hash(canonicalData)).toLowerCase()
    ].join('\n');

    var date = dateAsIso8601();

    // String to sign inspired by Amazon's v4 signature format
    // See: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
    //
    // We don't have a credential scope, so we skip it.
    //
    // But that modifies the format, so the format ID is RIPPLE1, instead of AWS4.
    var stringToSign = [
      'RIPPLE1-HMAC-SHA512',
      date,
      sjcl.codec.hex.fromBits(sjcl.hash.sha512.hash(canonicalRequest)).toLowerCase()
    ].join('\n');

    var hmac = new sjcl.misc.hmac(sjcl.codec.hex.toBits(this.data.auth_secret), sjcl.hash.sha512);
    var signature = sjcl.codec.hex.fromBits(hmac.mac(stringToSign));

    config.url += (parser.search ? "&" : "?") +
      'signature='+signature+
      '&signature_date='+date+
      '&signature_blob_id='+this.id;

    return config;
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

    console.log("client: blob: submitting update", BlobObj.opsReverseMap[op], pointer, params);

    params.unshift(pointer);
    params.unshift(op);

    var config = {
      method: 'POST',
      url: this.url + '/blob/patch',
      responseType: 'json',
      data: {
        blob_id: this.id,
        patch: encrypt(this.key, JSON.stringify(params))
      }
    };

    $http(this.signRequest(config))
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

  function BlobError(message, backend) {
    this.name = "BlobError";
    this.message = message || "";
    this.backend = backend || "generic";
  }

  BlobError.prototype = Error.prototype;

  BlobObj.BlobError = BlobError;

  return BlobObj;
}]);
