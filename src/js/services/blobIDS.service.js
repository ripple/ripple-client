'use strict';

var module = angular.module('blobids', []);

module.factory('rpBlobIDS', ['$rootScope', '$http', '$q', function($scope, $http, $q) {

  // Blob object class
  function BlobObj() {
    this.data = {};
  }

  // Blob operations
  // Do NOT change the mapping of existing ops
  BlobObj.ops = {
    // Special
    noop: 0,

    // Simple ops
    set: 16,
    unset: 17,
    extend: 18,

    // Meta ops
    push: 32,
    pop: 33,
    shift: 34,
    unshift: 35,
    filter: 36
  };

  BlobObj.opsReverseMap = [];
  for (var name in BlobObj.ops) {
    BlobObj.opsReverseMap[BlobObj.ops[name]] = name;
  }

  // Identity fields
  var identityRoot = 'identityVault';

  /**
   * Initialize a new blob object
   */

  BlobObj.prototype.init = function() {
    var self = this;

    return $http.get(
      Options.backend_url + '/api/blob', {
        headers: {'Authorization': 'Bearer ' + store.get('backend_token')},
        timeout: 8000
      }).then(function(response) {
        if (!response.data || !response.data.data || !response.data.data.account_id) {
          return $q.reject('Could not retrieve blob');
        }

        // TODO assign all fields
        self.ripple_name = response.data.ripple_name;
        self.identity = response.data.identity;
        self.device_id = response.data.device_id;
        self.encrypted_secret = response.data.encrypted_secret;
        self.data = response.data.data;

        // return with newly assembled blob
        return self;

      }, function(response) {
        if (response.status === 401) {
          // TODO check where should this be placed
          // backend token is broken
          store.remove('backend_token');
        }

        return $q.reject(response.data || 'Could not retrieve blob');
      });
  };

  /**** Blob updating functions ****/

  /**
   * Set blob element
   */

  BlobObj.prototype.set = function(pointer, value, fn) {
    if (pointer === '/' + identityRoot && this.data[identityRoot]) {
      return fn(new Error('Cannot overwrite Identity Vault'));
    }

    this.applyUpdate('set', pointer, [value]);
    this.postUpdate(fn);
  };

  /**
   * Remove blob element
   */

  BlobObj.prototype.unset = function(pointer, fn) {
    if (pointer === '/' + identityRoot) {
      return fn(new Error('Cannot remove Identity Vault'));
    }

    this.applyUpdate('unset', pointer, []);
    this.postUpdate(fn);
  };

  /**
   * Extend blob object
   */

  BlobObj.prototype.extend = function(pointer, value, fn) {
    this.applyUpdate('extend', pointer, [value]);
    this.postUpdate('extend', pointer, [value], fn);
  };

  /**
   * Prepend blob array
   */

  BlobObj.prototype.unshift = function(pointer, value, fn) {
    this.applyUpdate('unshift', pointer, [value]);
    this.postUpdate(fn);
  };

  /**
   * Filter the row(s) from an array.
   *
   * This method will find any entries from the array stored under `pointer` and
   * apply the `subcommands` to each of them.
   *
   * The subcommands can be any commands with the pointer parameter left out.
   */

  BlobObj.prototype.filter = function(pointer, field, value, subcommands, callback) {
    var args = Array.prototype.slice.apply(arguments);

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
    }

    args.shift();

    // Normalize subcommands to minimize the patch size
    args = args.slice(0, 2).concat(normalizeSubcommands(args.slice(2), true));

    this.applyUpdate('filter', pointer, args);
    this.postUpdate(callback);
  };

  /**
   * Apply udpdate to the blob
   */

  BlobObj.prototype.applyUpdate = function(op, path, params) {
    // Exchange from numeric op code to string
    if (typeof op === 'number') {
      op = BlobObj.opsReverseMap[op];
    }

    if (typeof op !== 'string') {
      throw new Error('Blob update op code must be a number or a valid op id string');
    }

    // Separate each step in the 'pointer'
    var pointer = path.split('/');
    var first = pointer.shift();

    if (first !== '') {
      throw new Error('Invalid JSON pointer: ' + path);
    }

    this._traverse(this.data, pointer, path, op, params);
  };

  // for applyUpdate function
  BlobObj.prototype._traverse = function(context, pointer, originalPointer, op, params) {
    var _this = this;
    var part = _this.unescapeToken(pointer.shift());

    if (Array.isArray(context)) {
      if (part === '-') {
        part = context.length;
      } else if (part % 1 !== 0 && part >= 0) {
        throw new Error('Invalid pointer, array element segments must be a positive integer, zero or \'-\'');
      }
    } else if (typeof context !== 'object') {
      return null;
    } else if (!context.hasOwnProperty(part)) {
      // Some opcodes create the path as they're going along
      if (op === 'set') {
        context[part] = {};
      } else if (op === 'unshift') {
        context[part] = [];
      } else {
        return null;
      }
    }

    if (pointer.length !== 0) {
      return this._traverse(context[part], pointer, originalPointer, op, params);
    }

    switch (op) {
      case 'set':
        context[part] = params[0];
        break;
      case 'unset':
        if (Array.isArray(context)) {
          context.splice(part, 1);
        } else {
          delete context[part];
        }
        break;
      case 'extend':
        if (typeof context[part] !== 'object') {
          throw new Error('Tried to extend a non-object');
        }
        // extend(true, context[part], params[0]);
        $.extend(context[part], params[0]);
        break;
      case 'unshift':
        if (typeof context[part] === 'undefined') {
          context[part] = [];
        } else if (!Array.isArray(context[part])) {
          throw new Error('Operator "unshift" must be applied to an array.');
        }
        context[part].unshift(params[0]);
        break;
      case 'filter':
        if (Array.isArray(context[part])) {
          context[part].forEach(function(element, i) {
            if (typeof element === 'object' && element.hasOwnProperty(params[0]) && element[params[0]] === params[1]) {
              var subpointer = originalPointer + '/' + i;
              var subcommands = normalizeSubcommands(params.slice(2));

              subcommands.forEach(function(subcommand) {
                var op = subcommand[0];
                var pointer = subpointer + subcommand[1];
                _this.applyUpdate(op, pointer, subcommand.slice(2));
              });
            }
          });
        }
        break;
      default:
        throw new Error('Unsupported op ' + op);
    }
  };

  BlobObj.prototype.escapeToken = function(token) {
    return token.replace(/[~\/]/g, function(key) {
      return key === '~' ? '~0' : '~1';
    });
  };

  BlobObj.prototype.unescapeToken = function(str) {
    return str.replace(/~./g, function(m) {
      switch (m) {
        case '~0':
          return '~';
        case '~1':
          return '/';
      }
      throw new Error('Invalid tilde escape: ' + m);
    });
  };

  /**
   * Sumbit update to blob vault
   */

  BlobObj.prototype.postUpdate = function(fn) {

    // Callback is optional
    if (typeof fn !== 'function') {
      fn = function() {
      };
    }

    var blobData = {};

    blobData.ripple_name = this.ripple_name;
    blobData.identity = this.identity;
    blobData.device_id = this.device_id;
    blobData.encrypted_secret = this.encrypted_secret;
    blobData.data = this.data;

    return $http.post(
      Options.backend_url + '/api/blob',
      blobData, {
        headers: {'Authorization': 'Bearer ' + store.get('backend_token')},
        timeout: 8000
      }).then(function(response) {
        if (!response.data) {
          return fn(new Error('Could not save blob'));
        }
        return fn(null, response.data);

      }, function(response) {
        return fn(new Error('Could not save blob'));
      }
    );
  };

  /***** helper functions *****/

  function normalizeSubcommands(subcommands, compress) {
    // Normalize parameter structure
    if (/(number|string)/.test(typeof subcommands[0])) {
      // Case 1: Single subcommand inline
      subcommands = [subcommands];
    } else if (subcommands.length === 1 && Array.isArray(subcommands[0]) && /(number|string)/.test(typeof subcommands[0][0])) {
      // Case 2: Single subcommand as array
      // (nothing to do)
    } else if (Array.isArray(subcommands[0])) {
      // Case 3: Multiple subcommands as array of arrays
      subcommands = subcommands[0];
    }

    // Normalize op name and convert strings to numeric codes
    subcommands = subcommands.map(function(subcommand) {
      if (typeof subcommand[0] === 'string') {
        subcommand[0] = BlobObj.ops[subcommand[0]];
      }

      if (typeof subcommand[0] !== 'number') {
        throw new Error('Invalid op in subcommand');
      }

      if (typeof subcommand[1] !== 'string') {
        throw new Error('Invalid path in subcommand');
      }

      return subcommand;
    });

    if (compress) {
      // Convert to the minimal possible format
      if (subcommands.length === 1) {
        return subcommands[0];
      }

      return [subcommands];

    }

    return subcommands;

  }

  /**
   * Blob object class
   */

  return BlobObj;

}]);
