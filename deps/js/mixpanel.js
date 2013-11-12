/*
 * Mixpanel JS Library v2.2.0
 *
 * Copyright 2012, Mixpanel, Inc. All Rights Reserved
 * http://mixpanel.com/
 *
 * Includes portions of Underscore.js
 * http://documentcloud.github.com/underscore/
 * (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
 * Released under the MIT License.
 */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name mixpanel-2.2.min.js
// ==/ClosureCompiler==

/*
Will export window.mixpanel
*/

/*
SIMPLE STYLE GUIDE:

this.x == public function
this._x == internal - only use within this file
this.__x == private - only use within the class

Globals should be all caps
*/
(function (mixpanel) {

/*
 * Saved references to long variable names, so that closure compiler can
 * minimize file size.
 */
    var   ArrayProto        = Array.prototype
        , ObjProto          = Object.prototype
        , slice             = ArrayProto.slice
        , toString          = ObjProto.toString
        , hasOwnProperty    = ObjProto.hasOwnProperty
        , windowConsole     = window.console
        , navigator         = window.navigator
        , document          = window.document
        , userAgent         = navigator.userAgent;

/*
 * Constants
 */
/** @const */   var   PRIMARY_INSTANCE_NAME     = "mixpanel"
/** @const */       , SET_QUEUE_KEY             = "__mps"
/** @const */       , SET_ONCE_QUEUE_KEY        = "__mpso"
/** @const */       , ADD_QUEUE_KEY             = "__mpa"
/** @const */       , APPEND_QUEUE_KEY          = "__mpap"
/** @const */       , SET_ACTION                = "$set"
/** @const */       , SET_ONCE_ACTION           = "$set_once"
/** @const */       , ADD_ACTION                = "$add"
/** @const */       , APPEND_ACTION             = "$append"
// This key is deprecated, but we want to check for it to see whether aliasing is allowed.
/** @const */       , PEOPLE_DISTINCT_ID_KEY    = "$people_distinct_id"
/** @const */       , ALIAS_ID_KEY              = "__alias"
/** @const */       , RESERVED_PROPERTIES       = [SET_QUEUE_KEY, SET_ONCE_QUEUE_KEY, ADD_QUEUE_KEY, APPEND_QUEUE_KEY, PEOPLE_DISTINCT_ID_KEY, ALIAS_ID_KEY];

/*
 * Dynamic... constants? Is that an oxymoron?
 */
    var   HTTP_PROTOCOL     = (("https:" == document.location.protocol) ? "https://" : "http://")
        , SNIPPET_VERSION   = (mixpanel && mixpanel['__SV']) || 0
        // http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
        // https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#withCredentials
        , USE_XHR           = (window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest())
        // IE<10 does not support cross-origin XHR's but script tags
        // with defer won't block window.onload; ENQUEUE_REQUESTS
        // should only be true for Opera<12
        , ENQUEUE_REQUESTS  = !USE_XHR && (userAgent.indexOf('MSIE') == -1);

/*
 * Closure-level globals
 */
    var   _                 = {}
        , DEBUG             = false
        , DEFAULT_CONFIG    = {
              "api_host":                   HTTP_PROTOCOL + 'api.mixpanel.com'
            , "cross_subdomain_cookie":     true
            , "cookie_name":                ""
            , "loaded":                     function() {}
            , "store_google":               true
            , "save_referrer":              true
            , "test":                       false
            , "verbose":                    false
            , "img":                        false
            , "track_pageview":             true
            , "debug":                      false
            , "track_links_timeout":        300
            , "cookie_expiration":          365
            , "upgrade":                    false
            , "disable_cookie":             false
            , "secure_cookie":              false
            , "ip":                         true
        }
        , DOM_LOADED        = false;

    // UNDERSCORE
    // Embed part of the Underscore Library

    (function() {
        var nativeForEach = ArrayProto.forEach,
            nativeIndexOf = ArrayProto.indexOf,
            nativeIsArray = Array.isArray,
            breaker = {};

        /**
         * @param {*=} obj
         * @param {function(...[*])=} iterator
         * @param {Object=} context
         */
        var each = _.each = function(obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === breaker) return;
                    }
                }
            }
        };

        _.extend = function(obj) {
            each(slice.call(arguments, 1), function(source) {
                for (var prop in source) {
                    if (source[prop] !== void 0) obj[prop] = source[prop];
                }
            });
            return obj;
        };

        _.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        };

        // from a comment on http://dbj.org/dbj/?p=286
        // fails on only one very rare and deliberate custom object:
        // var bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
        _.isFunction = function (f) {
            try {
                return /^\s*\bfunction\b/.test(f);
            } catch (x) {
                return false;
            }
        };

        _.isArguments = function(obj) {
            return !!(obj && hasOwnProperty.call(obj, 'callee'));
        };

        _.toArray = function(iterable) {
            if (!iterable)                return [];
            if (iterable.toArray)         return iterable.toArray();
            if (_.isArray(iterable))      return slice.call(iterable);
            if (_.isArguments(iterable))  return slice.call(iterable);
            return _.values(iterable);
        };

        _.values = function(obj) {
            var results = [];
            if (obj == null) return results;
            each(obj, function(value) {
                results[results.length] = value;
            });
            return results;
        };

        _.identity = function(value) {
            return value;
        };

        _.include = function(obj, target) {
            var found = false;
            if (obj == null) return found;
            if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
            each(obj, function(value) {
                if (found || (found = (value === target))) { return breaker; }
            });
            return found;
        };

        _.includes = function(str, needle) {
            return str.indexOf(needle) !== -1;
        };

    })();

    // Underscore Addons
    _.inherit = function(subclass, superclass) {
        subclass.prototype = new superclass();
        subclass.prototype.constructor = subclass;
        subclass.superclass = superclass.prototype;
        return subclass;
    };

    _.isObject = function(obj) {
        return (obj === Object(obj) && !_.isArray(obj));
    };

    _.isEmptyObject = function(obj) {
        if (_.isObject(obj)) {
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    _.isUndefined = function(obj) {
        return obj === void 0;
    };

    _.isString = function(obj) {
        return toString.call(obj) == '[object String]';
    };

    _.isDate = function(obj) {
        return toString.call(obj) == '[object Date]';
    };

    _.isNumber = function(obj) {
        return toString.call(obj) == '[object Number]';
    };

    _.encodeDates = function(obj) {
        _.each(obj, function(v, k) {
            if (_.isDate(v)) {
                obj[k] = _.formatDate(v);
            } else if (_.isObject(v)) {
                obj[k] = _.encodeDates(v); // recurse
            }
        });
        return obj;
    };

    _.formatDate = function(d) {
        // YYYY-MM-DDTHH:MM:SS in UTC
        function pad(n) {return n < 10 ? '0' + n : n}
        return d.getUTCFullYear() + '-'
            + pad(d.getUTCMonth() + 1) + '-'
            + pad(d.getUTCDate()) + 'T'
            + pad(d.getUTCHours()) + ':'
            + pad(d.getUTCMinutes()) + ':'
            + pad(d.getUTCSeconds());
    };

    _.strip_empty_properties = function(p) {
        var ret = {};
        _.each(p, function(v, k) {
            if (_.isString(v) && v.length > 0) { ret[k] = v; }
        });
        return ret;
    };

    /*
     * this function returns a copy of object after truncating it.  If
     * passed an Array or Object it will iterate through obj and
     * truncate all the values recursively.
     */
    _.truncate = function(obj, length) {
        var ret;

        if (typeof(obj) === "string") {
            ret = obj.slice(0, length);
        } else if (_.isArray(obj)) {
            ret = [];
            _.each(obj, function(val) {
                ret.push(_.truncate(val, length));
            });
        } else if (_.isObject(obj)) {
            ret = {};
            _.each(obj, function(val, key) {
                ret[key] = _.truncate(val, length);
            });
        } else {
            ret = obj;
        }

        return ret;
    };

    _.JSONEncode = (function() {
        return function(mixed_val) {
            var indent;
            var value = mixed_val;
            var i;

            var quote = function (string) {
                var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
                var meta = {    // table of character substitutions
                    '\b': '\\b',
                    '\t': '\\t',
                    '\n': '\\n',
                    '\f': '\\f',
                    '\r': '\\r',
                    '"' : '\\"',
                    '\\': '\\\\'
                };

                escapable.lastIndex = 0;
                return escapable.test(string) ?
                '"' + string.replace(escapable, function (a) {
                    var c = meta[a];
                    return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }) + '"' :
                '"' + string + '"';
            };

            var str = function(key, holder) {
                var gap = '';
                var indent = '    ';
                var i = 0;          // The loop counter.
                var k = '';          // The member key.
                var v = '';          // The member value.
                var length = 0;
                var mind = gap;
                var partial = [];
                var value = holder[key];

                // If the value has a toJSON method, call it to obtain a replacement value.
                if (value && typeof value === 'object' &&
                    typeof value.toJSON === 'function') {
                    value = value.toJSON(key);
                }

                // What happens next depends on the value's type.
                switch (typeof value) {
                    case 'string':
                        return quote(value);

                    case 'number':
                        // JSON numbers must be finite. Encode non-finite numbers as null.
                        return isFinite(value) ? String(value) : 'null';

                    case 'boolean':
                    case 'null':
                        // If the value is a boolean or null, convert it to a string. Note:
                        // typeof null does not produce 'null'. The case is included here in
                        // the remote chance that this gets fixed someday.

                        return String(value);

                    case 'object':
                        // If the type is 'object', we might be dealing with an object or an array or
                        // null.
                        // Due to a specification blunder in ECMAScript, typeof null is 'object',
                        // so watch out for that case.
                        if (!value) {
                            return 'null';
                        }

                        // Make an array to hold the partial results of stringifying this object value.
                        gap += indent;
                        partial = [];

                        // Is the value an array?
                        if (toString.apply(value) === '[object Array]') {
                            // The value is an array. Stringify every element. Use null as a placeholder
                            // for non-JSON values.

                            length = value.length;
                            for (i = 0; i < length; i += 1) {
                                partial[i] = str(i, value) || 'null';
                            }

                            // Join all of the elements together, separated with commas, and wrap them in
                            // brackets.
                            v = partial.length === 0 ? '[]' :
                            gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                            mind + ']' :
                            '[' + partial.join(',') + ']';
                            gap = mind;
                            return v;
                        }

                        // Iterate through all of the keys in the object.
                        for (k in value) {
                            if (hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }

                        // Join all of the member texts together, separated with commas,
                        // and wrap them in braces.
                        v = partial.length === 0 ? '{}' :
                        gap ? '{' + partial.join(',') + '' +
                        mind + '}' : '{' + partial.join(',') + '}';
                        gap = mind;
                        return v;
                }
            };

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            return str('', {
                '': value
            });
        };
    })();

    _.JSONDecode = (function() { // https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
        var at,     // The index of the current character
            ch,     // The current character
            escapee = {
                '"':  '"',
                '\\': '\\',
                '/':  '/',
                'b':  '\b',
                'f':  '\f',
                'n':  '\n',
                'r':  '\r',
                't':  '\t'
            },
            text,
            error = function (m) {
                throw {
                    name:    'SyntaxError',
                    message: m,
                    at:      at,
                    text:    text
                };
            },
            next = function (c) {
                // If a c parameter is provided, verify that it matches the current character.
                if (c && c !== ch) {
                    error("Expected '" + c + "' instead of '" + ch + "'");
                }
                // Get the next character. When there are no more characters,
                // return the empty string.
                ch = text.charAt(at);
                at += 1;
                return ch;
            },
            number = function () {
                // Parse a number value.
                var number,
                    string = '';

                if (ch === '-') {
                    string = '-';
                    next('-');
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
                if (ch === '.') {
                    string += '.';
                    while (next() && ch >= '0' && ch <= '9') {
                        string += ch;
                    }
                }
                if (ch === 'e' || ch === 'E') {
                    string += ch;
                    next();
                    if (ch === '-' || ch === '+') {
                        string += ch;
                        next();
                    }
                    while (ch >= '0' && ch <= '9') {
                        string += ch;
                        next();
                    }
                }
                number = +string;
                if (!isFinite(number)) {
                    error("Bad number");
                } else {
                    return number;
                }
            },

            string = function () {
                // Parse a string value.
                var hex,
                    i,
                    string = '',
                    uffff;
                // When parsing for string values, we must look for " and \ characters.
                if (ch === '"') {
                    while (next()) {
                        if (ch === '"') {
                            next();
                            return string;
                        }
                        if (ch === '\\') {
                            next();
                            if (ch === 'u') {
                                uffff = 0;
                                for (i = 0; i < 4; i += 1) {
                                    hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                string += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === 'string') {
                                string += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            string += ch;
                        }
                    }
                }
                error("Bad string");
            },
            white = function () {
                // Skip whitespace.
                while (ch && ch <= ' ') {
                    next();
                }
            },
            word = function () {
                // true, false, or null.
                switch (ch) {
                case 't':
                    next('t');
                    next('r');
                    next('u');
                    next('e');
                    return true;
                case 'f':
                    next('f');
                    next('a');
                    next('l');
                    next('s');
                    next('e');
                    return false;
                case 'n':
                    next('n');
                    next('u');
                    next('l');
                    next('l');
                    return null;
                }
                error("Unexpected '" + ch + "'");
            },
            value,  // Placeholder for the value function.
            array = function () {
                // Parse an array value.
                var array = [];

                if (ch === '[') {
                    next('[');
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;   // empty array
                    }
                    while (ch) {
                        array.push(value());
                        white();
                        if (ch === ']') {
                            next(']');
                            return array;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad array");
            },
            object = function () {
                // Parse an object value.
                var key,
                    object = {};

                if (ch === '{') {
                    next('{');
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;   // empty object
                    }
                    while (ch) {
                        key = string();
                        white();
                        next(':');
                        if (Object.hasOwnProperty.call(object, key)) {
                            error('Duplicate key "' + key + '"');
                        }
                        object[key] = value();
                        white();
                        if (ch === '}') {
                            next('}');
                            return object;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad object");
            };

        value = function () {
            // Parse a JSON value. It could be an object, an array, a string,
            // a number, or a word.
            white();
            switch (ch) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
                return string();
            case '-':
                return number();
            default:
                return ch >= '0' && ch <= '9' ? number() : word();
            }
        };

        // Return the json_parse function. It will have access to all of the
        // above functions and variables.
        return function (source) {
            var result;

            text = source;
            at = 0;
            ch = ' ';
            result = value();
            white();
            if (ch) {
                error("Syntax error");
            }

            return result;
        };
    })();

    _.base64Encode = function(data) {
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

        if (!data) {
            return data;
        }

        data = _.utf8Encode(data);

        do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1<<16 | o2<<8 | o3;

            h1 = bits>>18 & 0x3f;
            h2 = bits>>12 & 0x3f;
            h3 = bits>>6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        switch( data.length % 3 ){
            case 1:
                enc = enc.slice(0, -2) + '==';
                break;
            case 2:
                enc = enc.slice(0, -1) + '=';
                break;
        }

        return enc;
    };

    _.utf8Encode = function(string) {
        string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        var utftext = "",
            start,
            end;
        var stringl = 0,
            n;

        start = end = 0;
        stringl = string.length;

        for (n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if((c1 > 127) && (c1 < 2048)) {
                enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
            } else {
                enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.substring(start, end);
                }
                utftext += enc;
                start = end = n+1;
            }
        }

        if (end > start) {
            utftext += string.substring(start, string.length);
        }

        return utftext;
    };

    _.UUID = (function() {

        // Time/ticks information
        // 1*new Date() is a cross browser version of Date.now()
        var T = function() {
            var d = 1*new Date()
            , i = 0;

            // this while loop figures how many browser ticks go by
            // before 1*new Date() returns a new number, ie the amount
            // of ticks that go by per millisecond
            while (d == 1*new Date()) { i++; }

            return d.toString(16) + i.toString(16);
        };

        // Math.Random entropy
        var R = function() {
            return Math.random().toString(16).replace('.','');
        };

        // User agent entropy
        // This function takes the user agent string, and then xors
        // together each sequence of 8 bytes.  This produces a final
        // sequence of 8 bytes which it returns as hex.
        var UA = function(n) {
            var ua = userAgent, i, ch, buffer = [], ret = 0;

            function xor(result, byte_array) {
                var j, tmp = 0;
                for (j = 0; j < byte_array.length; j++) {
                    tmp |= (buffer[j] << j*8);
                }
                return result ^ tmp;
            }

            for (i = 0; i < ua.length; i++) {
                ch = ua.charCodeAt(i);
                buffer.unshift(ch & 0xFF);
                if (buffer.length >= 4) {
                    ret = xor(ret, buffer);
                    buffer = [];
                }
            }

            if (buffer.length > 0) { ret = xor(ret, buffer); }

            return ret.toString(16);
        };

        return function() {
            var se = (screen.height*screen.width).toString(16);
            return (T()+"-"+R()+"-"+UA()+"-"+se+"-"+T());
        };
    })();

    // _.isBlockedUA()
    // This is to block various web spiders from executing our JS and
    // sending false tracking data
    _.isBlockedUA = function() {
        var a = userAgent;
        if (/(google web preview|baiduspider|yandexbot)/i.test(a)) {
            return true;
        }
        return false;
    };

    /**
     * @param {Object=} formdata
     * @param {string=} arg_separator
     */
    _.HTTPBuildQuery = function(formdata, arg_separator) {
        var key, use_val, use_key, tmp_arr = [];

        if (typeof(arg_separator) === "undefined") {
            arg_separator = '&';
        }

        _.each(formdata, function(val, key) {
            use_val = encodeURIComponent(val.toString());
            use_key = encodeURIComponent(key);
            tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
        });

        return tmp_arr.join(arg_separator);
    };

    _.getQueryParam = function(url, param) {
        // Expects a raw URL

        param = param.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + param + "=([^&#]*)",
            regex = new RegExp( regexS ),
            results = regex.exec(url);
        if (results === null || (results && typeof(results[1]) !== 'string' && results[1].length)) {
            return '';
        } else {
            return decodeURIComponent(results[1]).replace(/\+/g, ' ');
        }
    };

    // _.cookie
    // Methods partially borrowed from quirksmode.org/js/cookies.html
    _.cookie = {
        get: function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
            }
            return null;
        },

        parse: function(name) {
            var cookie;
            try {
                cookie = _.JSONDecode(_.cookie.get(name)) || {};
            } catch (err) {}
            return cookie;
        },

        set: function(name, value, days, cross_subdomain, is_secure) {
            var cdomain = "", expires = "", secure = "";

            if (cross_subdomain) {
                var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i)
                    , domain = matches ? matches[0] : '';

                cdomain   = ((domain) ? "; domain=." + domain : "");
            }

            if (days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                expires = "; expires=" + date.toGMTString();
            }

            if (is_secure) {
                secure = "; secure";
            }

            document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/" + cdomain + secure;
        },

        remove: function(name, cross_subdomain) {
            _.cookie.set(name, '', -1, cross_subdomain);
        }
    };

    _.register_event = (function() {
        // written by Dean Edwards, 2005
        // with input from Tino Zijdel - crisp@xs4all.nl
        // with input from Carl Sverre - mail@carlsverre.com
        // with input from Mixpanel
        // http://dean.edwards.name/weblog/2005/10/add-event/
        // https://gist.github.com/1930440

        /**
        * @param {Object} element
        * @param {string} type
        * @param {function(...[*])} handler
        * @param {boolean=} oldSchool
        */
        var register_event = function(element, type, handler, oldSchool) {
            if (!element) {
                console.error("No valid element provided to register_event");
                return;
            }

            if (element.addEventListener && !oldSchool) {
                element.addEventListener(type, handler, false);
            } else {
                var ontype = 'on' + type;
                var old_handler = element[ontype]; // can be undefined
                element[ontype] = makeHandler(element, handler, old_handler);
            }
        };

        function makeHandler(element, new_handler, old_handlers) {
            var handler = function(event) {
                event = event || fixEvent(window.event);

                // this basically happens in firefox whenever another script
                // overwrites the onload callback and doesn't pass the event
                // object to previously defined callbacks.  All the browsers
                // that don't define window.event implement addEventListener
                // so the dom_loaded handler will still be fired as usual.
                if (!event) { return undefined; }

                var ret = true;
                var old_result, new_result;

                if (_.isFunction(old_handlers)) {
                    old_result = old_handlers(event);
                }
                new_result = new_handler.call(element, event);

                if ((false === old_result) || (false === new_result)) {
                    ret = false;
                }

                return ret;
            };

            return handler;
        };

        function fixEvent(event) {
            if (event) {
                event.preventDefault = fixEvent.preventDefault;
                event.stopPropagation = fixEvent.stopPropagation;
            }
            return event;
        };
        fixEvent.preventDefault = function() {
            this.returnValue = false;
        };
        fixEvent.stopPropagation = function() {
            this.cancelBubble = true;
        };

        return register_event;
    })();

    _.dom_query = (function() {
        /* document.getElementsBySelector(selector)
        - returns an array of element objects from the current document
        matching the CSS selector. Selectors can contain element names,
        class names and ids and can be nested. For example:

        elements = document.getElementsBySelector('div#main p a.external')

        Will return an array of all 'a' elements with 'external' in their
        class attribute that are contained inside 'p' elements that are
        contained inside the 'div' element which has id="main"

        New in version 0.4: Support for CSS2 and CSS3 attribute selectors:
        See http://www.w3.org/TR/css3-selectors/#attribute-selectors

        Version 0.4 - Simon Willison, March 25th 2003
        -- Works in Phoenix 0.5, Mozilla 1.3, Opera 7, Internet Explorer 6, Internet Explorer 5 on Windows
        -- Opera 7 fails

        Version 0.5 - Carl Sverre, Jan 7th 2013
        -- Now uses jQuery-esque `hasClass` for testing class name
        equality.  This fixes a bug related to '-' characters being
        considered not part of a 'word' in regex.
        */

        function getAllChildren(e) {
            // Returns all children of element. Workaround required for IE5/Windows. Ugh.
            return e.all ? e.all : e.getElementsByTagName('*');
        }

        var bad_whitespace = /[\t\r\n]/g;
        function hasClass(elem, selector) {
            var className = " " + selector + " ";
            return ((" " + elem.className + " ").replace(bad_whitespace, " ").indexOf(className) >= 0);
        }

        function getElementsBySelector(selector) {
            // Attempt to fail gracefully in lesser browsers
            if (!document.getElementsByTagName) {
                return new Array();
            }
            // Split selector in to tokens
            var tokens = selector.split(' ');
            var token;
            var currentContext = new Array(document);
            for (var i = 0; i < tokens.length; i++) {
                token = tokens[i].replace(/^\s+/,'').replace(/\s+$/,'');
                if (token.indexOf('#') > -1) {
                    // Token is an ID selector
                    var bits = token.split('#');
                    var tagName = bits[0];
                    var id = bits[1];
                    var element = document.getElementById(id);
                    if (!element || (tagName && element.nodeName.toLowerCase() != tagName)) {
                        // element not found or tag with that ID not found, return false
                        return new Array();
                    }
                    // Set currentContext to contain just this element
                    currentContext = new Array(element);
                    continue; // Skip to next token
                }
                if (token.indexOf('.') > -1) {
                    // Token contains a class selector
                    var bits = token.split('.');
                    var tagName = bits[0];
                    var className = bits[1];
                    if (!tagName) {
                        tagName = '*';
                    }
                    // Get elements matching tag, filter them for class selector
                    var found = new Array;
                    var foundCount = 0;
                    for (var h = 0; h < currentContext.length; h++) {
                        var elements;
                        if (tagName == '*') {
                            elements = getAllChildren(currentContext[h]);
                        } else {
                            elements = currentContext[h].getElementsByTagName(tagName);
                        }
                        for (var j = 0; j < elements.length; j++) {
                            found[foundCount++] = elements[j];
                        }
                    }
                    currentContext = new Array;
                    var currentContextIndex = 0;
                    for (var k = 0; k < found.length; k++) {
                        if (found[k].className
                            && _.isString(found[k].className)   // some SVG elements have classNames which are not strings
                            && hasClass(found[k], className)
                        ) {
                            currentContext[currentContextIndex++] = found[k];
                        }
                    }
                    continue; // Skip to next token
                }
                // Code to deal with attribute selectors
                if (token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
                    var tagName = RegExp.$1;
                    var attrName = RegExp.$2;
                    var attrOperator = RegExp.$3;
                    var attrValue = RegExp.$4;
                    if (!tagName) {
                        tagName = '*';
                    }
                    // Grab all of the tagName elements within current context
                    var found = new Array;
                    var foundCount = 0;
                    for (var h = 0; h < currentContext.length; h++) {
                        var elements;
                        if (tagName == '*') {
                            elements = getAllChildren(currentContext[h]);
                        } else {
                            elements = currentContext[h].getElementsByTagName(tagName);
                        }
                        for (var j = 0; j < elements.length; j++) {
                            found[foundCount++] = elements[j];
                        }
                    }
                    currentContext = new Array;
                    var currentContextIndex = 0;
                    var checkFunction; // This function will be used to filter the elements
                    switch (attrOperator) {
                        case '=': // Equality
                            checkFunction = function(e) { return (e.getAttribute(attrName) == attrValue); };
                            break;
                        case '~': // Match one of space seperated words
                            checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('\\b'+attrValue+'\\b'))); };
                            break;
                        case '|': // Match start with value followed by optional hyphen
                            checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('^'+attrValue+'-?'))); };
                            break;
                        case '^': // Match starts with value
                            checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) == 0); };
                            break;
                        case '$': // Match ends with value - fails with "Warning" in Opera 7
                            checkFunction = function(e) { return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length); };
                            break;
                        case '*': // Match ends with value
                            checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) > -1); };
                            break;
                        default :
                            // Just test for existence of attribute
                            checkFunction = function(e) { return e.getAttribute(attrName); };
                    }
                    currentContext = new Array;
                    currentContextIndex = 0;
                    for (var k = 0; k < found.length; k++) {
                        if (checkFunction(found[k])) {
                            currentContext[currentContextIndex++] = found[k];
                        }
                    }
                    // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
                    continue; // Skip to next token
                }
                // If we get here, token is JUST an element (not a class or ID selector)
                tagName = token;
                var found = new Array;
                var foundCount = 0;
                for (var h = 0; h < currentContext.length; h++) {
                    var elements = currentContext[h].getElementsByTagName(tagName);
                    for (var j = 0; j < elements.length; j++) {
                        found[foundCount++] = elements[j];
                    }
                }
                currentContext = found;
            }
            return currentContext;
        };

        return getElementsBySelector;
    })();

    _.info = {
        campaignParams: function() {
            var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' ')
                , kw = ''
                , params = {};
            _.each(campaign_keywords, function(kwkey) {
                kw = _.getQueryParam(document.URL, kwkey);
                if (kw.length) {
                    params[kwkey] = kw;
                }
            });

            return params;
        },

        searchEngine: function(referrer) {
            if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
                return 'google';
            } else if (referrer.search('https?://(.*)bing.com') === 0) {
                return 'bing';
            } else if (referrer.search('https?://(.*)yahoo.com') === 0) {
                return 'yahoo';
            } else if (referrer.search('https?://(.*)duckduckgo.com') === 0) {
                return 'duckduckgo';
            } else {
                return null;
            }
        },

        searchInfo: function(referrer) {
            var search = _.info.searchEngine(referrer)
                , param = (search != "yahoo") ? "q" : "p"
                , ret = {};

            if (search !== null) {
                ret["$search_engine"] = search;

                var keyword = _.getQueryParam(referrer, param);
                if (keyword.length) {
                    ret["mp_keyword"] = keyword;
                }
            }

            return ret;
        },

        /**
         * This function detects which browser is running this script.
         * The order of the checks are important since many user agents
         * include key words used in later checks.
         */
        browser: function() {
            var ua = userAgent
                , vend = navigator.vendor || ''; // vendor is undefined for at least IE9
            if (window.opera) {
                if (_.includes(ua, "Mini")) {
                    return "Opera Mini";
                }
                return "Opera";
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(ua)) {
                return 'BlackBerry';
            } else if (_.includes(ua, "Chrome")) {
                return "Chrome";
            } else if (_.includes(vend, "Apple")) {
                if (_.includes(ua, "Mobile")) {
                    return "Mobile Safari";
                }
                return "Safari";
            } else if (_.includes(ua, "Android")) {
                return "Android Mobile";
            } else if (_.includes(ua, "Konqueror")) {
                return "Konqueror";
            } else if (_.includes(ua, "Firefox")) {
                return "Firefox";
            } else if (_.includes(ua, "MSIE")) {
                return "Internet Explorer";
            } else if (_.includes(ua, "Gecko")) {
                return "Mozilla";
            } else {
                return "";
            }
        },

        os: function() {
            var a = userAgent;
            if (/Windows/i.test(a)) {
                if (/Phone/.test(a)) { return 'Windows Mobile'; }
                return 'Windows';
            } else if (/(iPhone|iPad|iPod)/.test(a)) {
                return 'iOS';
            } else if (/Android/.test(a)) {
                return 'Android';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
                return 'BlackBerry';
            } else if (/Mac/i.test(a)) {
                return 'Mac OS X';
            } else if (/Linux/.test(a)) {
                return 'Linux';
            } else {
                return '';
            }
        },

        device: function() {
            var a = userAgent;
            if (/iPhone/.test(a)) {
                return 'iPhone';
            } else if (/iPad/.test(a)) {
                return 'iPad';
            } else if (/iPod/.test(a)) {
                return 'iPod Touch';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
                return 'BlackBerry';
            } else if (/Windows Phone/i.test(a)) {
                return 'Windows Phone';
            } else if (/Android/.test(a)) {
                return 'Android';
            } else {
                return '';
            }
        },

        referringDomain: function(referrer) {
            var split = referrer.split("/");
            if (split.length >= 3) {
                return split[2];
            }
            return "";
        },

        properties: function() {
            return _.strip_empty_properties({
                '$os': _.info.os(),
                '$browser': _.info.browser(),
                '$referrer': document.referrer,
                '$referring_domain': _.info.referringDomain(document.referrer),
                '$device': _.info.device(),
                'mp_lib': 'web'
            });
        },

        people_properties: function() {
            return _.strip_empty_properties({
                '$os': _.info.os(),
                '$browser': _.info.browser()
            });
        },

        pageviewInfo: function(page) {
            return _.strip_empty_properties({
                'mp_page': page
                , 'mp_referrer': document.referrer
                , 'mp_browser': _.info.browser()
                , 'mp_platform': _.info.os()
            });
        }
    };

    // Console override
    var console = {
        /** @type {function(...[*])} */
        log: function() {
            if (DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
                try {
                    windowConsole.log.apply(windowConsole, arguments);
                } catch(err) {
                    _.each(arguments, function(arg) {
                        windowConsole.log(arg);
                    });
                }
            }
        },
        /** @type {function(...[*])} */
        error: function() {
            if (DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
                var args = ["Mixpanel error:"].concat(_.toArray(arguments));
                try {
                    windowConsole.error.apply(windowConsole, args);
                } catch(err) {
                    _.each(args, function(arg) {
                        windowConsole.error(arg);
                    });
                }
            }
        },
        /** @type {function(...[*])} */
        critical: function() {
            if (!_.isUndefined(windowConsole) && windowConsole) {
                var args = ["Mixpanel error:"].concat(_.toArray(arguments));
                try {
                    windowConsole.error.apply(windowConsole, args);
                } catch(err) {
                    _.each(args, function(arg) {
                        windowConsole.error(arg);
                    });
                }
            }
        }
    };

    /**
     * DomTracker Object
     * @constructor
     */
    var DomTracker = function() {};

    // interface
    DomTracker.prototype.create_properties = function() {};
    DomTracker.prototype.event_handler = function() {};
    DomTracker.prototype.after_track_handler = function() {};

    DomTracker.prototype.init = function(mixpanel_instance) {
        this.mp = mixpanel_instance;
        return this;
    };

    /**
     * @param {string} query
     * @param {string} event_name
     * @param {Object=} properties
     * @param {function(...[*])=} user_callback
     */
    DomTracker.prototype.track = function(query, event_name, properties, user_callback) {
        var that = this
        , elements = _.dom_query(query);

        if (elements.length == 0) {
            console.error("The DOM query (" + query + ") returned 0 elements");
            return;
        }

        _.each(elements, function(element) {
            _.register_event(element, this.override_event, function(e) {
                var options = {}
                    , props = that.create_properties(properties, this)
                    , timeout = that.mp.get_config("track_links_timeout");

                that.event_handler(e, this, options);

                // in case the mixpanel servers don't get back to us in time
                window.setTimeout(that.track_callback(user_callback, props, options, true), timeout);

                // fire the tracking event
                that.mp.track(event_name, props, that.track_callback(user_callback, props, options));
            });
        }, this);

        return true;
    };

    /**
     * @param {function(...[*])} user_callback
     * @param {Object} props
     * @param {boolean=} timeout_occured
     */
    DomTracker.prototype.track_callback = function(user_callback, props, options, timeout_occured) {
        timeout_occured = timeout_occured || false;
        var that = this;

        return function() {
            // options is referenced from both callbacks, so we can have
            // a "lock" of sorts to ensure only one fires
            if (options.callback_fired) { return; }
            options.callback_fired = true;

            if (user_callback && user_callback(timeout_occured, props) === false) {
                // user can prevent the default functionality by
                // returning false from their callback
                return;
            }

            that.after_track_handler(props, options, timeout_occured);
        };
    };

    DomTracker.prototype.create_properties = function(properties, element) {
        var props;

        if (typeof(properties) === "function") {
            props = properties(element);
        } else {
            props = _.extend({}, properties);
        }

        return props;
    };

    /**
     * LinkTracker Object
     * @constructor
     * @extends DomTracker
     */
    var LinkTracker = function() {
        this.override_event = "click";
    };
    _.inherit(LinkTracker, DomTracker);

    LinkTracker.prototype.create_properties = function(properties, element) {
        var props = LinkTracker.superclass.create_properties.apply(this, arguments);

        if (element.href) { props["url"] = element.href; }

        return props;
    };

    LinkTracker.prototype.event_handler = function(evt, element, options) {
        options.new_tab = (evt.which === 2 || evt.metaKey || element.target === "_blank");
        options.href = element.href;

        if (!options.new_tab) {
            evt.preventDefault();
        }
    };

    LinkTracker.prototype.after_track_handler = function(props, options, timeout_occured) {
        if (options.new_tab) { return; }

        setTimeout(function() {
            window.location = options.href;
        }, 0);
    };

    /**
     * FormTracker Object
     * @constructor
     * @extends DomTracker
     */
    var FormTracker = function() {
        this.override_event = "submit";
    };
    _.inherit(FormTracker, DomTracker);

    FormTracker.prototype.event_handler = function(evt, element, options) {
        options.element = element;
        evt.preventDefault();
    };

    FormTracker.prototype.after_track_handler = function(props, options, timeout_occured) {
        setTimeout(function() {
            options.element.submit();
        }, 0);
    };

    /**
     * Mixpanel Cookie Object
     * @constructor
     */
    var MixpanelCookie = function(config) {
        this['props'] = {};
        this.campaign_params_saved = false;

        if (config['cookie_name']) {
            this.name = "mp_" + config['cookie_name'];
        } else {
            this.name = "mp_" + config['token'] + "_mixpanel";
        }
        this.load();
        this.update_config(config);
        this.upgrade(config);
        this.save();
    };

    MixpanelCookie.prototype.properties = function() {
        var p = {};
        // Filter out reserved properties
        _.each(this['props'], function(v, k) {
            if (!_.include(RESERVED_PROPERTIES, k)) {
                p[k] = v;
            }
        });
        return p;
    };

    MixpanelCookie.prototype.load = function() {
        if (this.disabled) { return; }

        var cookie = _.cookie.parse(this.name);

        if (cookie) {
            this['props'] = _.extend({}, cookie);
        }
    };

    MixpanelCookie.prototype.upgrade = function(config) {
        var should_upgrade = config['upgrade'],
            old_cookie_name,
            old_cookie;

        if (should_upgrade) {
            old_cookie_name = "mp_super_properties";
            // Case where they had a custom cookie name before.
            if (typeof(should_upgrade) === "string") {
                old_cookie_name = should_upgrade;
            }

            old_cookie = _.cookie.parse(old_cookie_name);

            // remove the cookie
            _.cookie.remove(old_cookie_name);
            _.cookie.remove(old_cookie_name, true);

            if (old_cookie) {
                this['props'] = _.extend(
                    this['props'],
                    old_cookie['all'],
                    old_cookie['events']
                );
            }
        }

        if (!config['cookie_name'] && config['name'] !== 'mixpanel') {
            // special case to handle people with cookies of the form
            // mp_TOKEN_INSTANCENAME from the first release of this library
            old_cookie_name = "mp_" + config['token'] + "_" + config['name'];
            old_cookie = _.cookie.parse(old_cookie_name);

            if (old_cookie) {
                _.cookie.remove(old_cookie_name);
                _.cookie.remove(old_cookie_name, true);

                // Save the prop values that were in the cookie from before -
                // this should only happen once as we delete the old one.
                this.register_once(old_cookie);
            }
        }
    };

    MixpanelCookie.prototype.save = function() {
        if (this.disabled) { return; }
        _.cookie.set(
            this.name,
            _.JSONEncode(this['props']),
            this.expire_days,
            this.cross_subdomain,
            this.secure
        );
    };

    MixpanelCookie.prototype.remove = function() {
        // remove both domain and subdomain cookies
        _.cookie.remove(this.name, false);
        _.cookie.remove(this.name, true);
    };

    // removes the cookie and deletes all loaded data
    // forced name for tests
    MixpanelCookie.prototype.clear = function() {
        this.remove();
        this['props'] = {};
    };

    /**
     * @param {Object} props
     * @param {*=} default_value
     * @param {number=} days
     */
    MixpanelCookie.prototype.register_once = function(props, default_value, days) {
        if (_.isObject(props)) {
            if (typeof(default_value) === 'undefined') { default_value = "None"; }
            this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

            _.each(props, function(val, prop) {
                if (!this['props'][prop] || this['props'][prop] === default_value) {
                    this['props'][prop] = val;
                }
            }, this);

            this.save();

            return true;
        }
        return false;
    };

    /**
     * @param {Object} props
     * @param {number=} days
     */
    MixpanelCookie.prototype.register = function(props, days) {
        if (_.isObject(props)) {
            this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

            _.extend(this['props'], props);

            this.save();

            return true;
        }
        return false;
    };

    MixpanelCookie.prototype.unregister = function(prop) {
        if (prop in this['props']) {
            delete this['props'][prop];
            this.save();
        }
    };

    MixpanelCookie.prototype.update_campaign_params = function() {
        if (!this.campaign_params_saved) {
            this.register_once(_.info.campaignParams());
            this.campaign_params_saved = true;
        }
    };

    MixpanelCookie.prototype.update_search_keyword = function(referrer) {
        this.register(_.info.searchInfo(referrer));
    };

    // EXPORTED METHOD, we test this directly.
    MixpanelCookie.prototype.update_referrer_info = function(referrer) {
        // If referrer doesn't exist, we want to note the fact that it was type-in traffic.
        this.register_once({
            "$initial_referrer": referrer || "$direct",
            "$initial_referring_domain": _.info.referringDomain(referrer) || "$direct"
        }, "");
    };

    MixpanelCookie.prototype.get_referrer_info = function() {
        return _.strip_empty_properties({
            '$initial_referrer': this['props']['$initial_referrer'],
            '$initial_referring_domain': this['props']['$initial_referring_domain']
        });
    };

    // safely fills the passed in object with the cookies properties,
    // does not override any properties defined in both
    // returns the passed in object
    MixpanelCookie.prototype.safe_merge = function(props) {
        _.each(this['props'], function(val, prop) {
            if (!(prop in props)) {
                props[prop] = val;
            }
        });

        return props;
    };

    MixpanelCookie.prototype.update_config = function(config) {
        this.default_expiry = this.expire_days = config['cookie_expiration'];
        this.set_disabled(config['disable_cookie']);
        this.set_cross_subdomain(config['cross_subdomain_cookie']);
        this.set_secure(config['secure_cookie']);
    };

    MixpanelCookie.prototype.set_disabled = function(disabled) {
        this.disabled = disabled;
        if (this.disabled) {
            this.remove();
        }
    };

    MixpanelCookie.prototype.set_cross_subdomain = function(cross_subdomain) {
        if (cross_subdomain !== this.cross_subdomain) {
            this.cross_subdomain = cross_subdomain;
            this.remove();
            this.save();
        }
    };

    MixpanelCookie.prototype.get_cross_subdomain = function() {
        return this.cross_subdomain;
    };

    MixpanelCookie.prototype.set_secure = function(secure) {
        if (secure !== this.secure) {
            this.secure = secure ? true : false;
            this.remove();
            this.save();
        }
    };

    MixpanelCookie.prototype._add_to_people_queue = function(queue, data) {
        var q_key = this._get_queue_key(queue),
            q_data = data[queue],
            set_q = this._get_or_create_queue(SET_ACTION),
            set_once_q = this._get_or_create_queue(SET_ONCE_ACTION),
            add_q = this._get_or_create_queue(ADD_ACTION),
            append_q = this._get_or_create_queue(APPEND_ACTION, []);

        if (q_key === SET_QUEUE_KEY) {
            // Update the set queue - we can override any existing values
            _.extend(set_q, q_data);
            // if there was a pending increment, override it
            // with the set.
            this._pop_from_people_queue(ADD_ACTION, q_data);
        } else if (q_key === SET_ONCE_QUEUE_KEY) {
            // only queue the data if there is not already a set_once call for it.
            _.each(q_data, function(v, k) {
                if (!(k in set_once_q)) {
                    set_once_q[k] = v;
                }
            });
        } else if (q_key === ADD_QUEUE_KEY) {
            _.each(q_data, function(v, k) {
                // If it exists in the set queue, increment
                // the value
                if (k in set_q) {
                    set_q[k] += v;
                } else {
                    // If it doesn't exist, update the add
                    // queue
                    if (!(k in add_q)) {
                        add_q[k] = 0;
                    }
                    add_q[k] += v;
                }
            }, this);
        } else if (q_key === APPEND_QUEUE_KEY) {
            append_q.push(q_data);
        }

        console.log("MIXPANEL PEOPLE REQUEST (QUEUED, PENDING IDENTIFY):");
        console.log(data);

        this.save();
    };

    MixpanelCookie.prototype._pop_from_people_queue = function(queue, data) {
        var q = this._get_queue(queue);
        if (!_.isUndefined(q)) {
            _.each(data, function(v, k) {
                delete q[k];
            }, this);

            this.save();
        }
    };

    MixpanelCookie.prototype._get_queue_key = function(queue) {
        if (queue === SET_ACTION) {
            return SET_QUEUE_KEY;
        } else if (queue === SET_ONCE_ACTION) {
            return SET_ONCE_QUEUE_KEY;
        } else if (queue === ADD_ACTION) {
            return ADD_QUEUE_KEY;
        } else if (queue === APPEND_ACTION) {
            return APPEND_QUEUE_KEY;
        } else {
            console.error("Invalid queue:", queue);
        }
    };

    MixpanelCookie.prototype._get_queue = function(queue) {
        return this['props'][this._get_queue_key(queue)];
    };
    MixpanelCookie.prototype._get_or_create_queue = function(queue, default_val) {
        var key = this._get_queue_key(queue),
            default_val = _.isUndefined(default_val) ? {} : default_val;

        return this['props'][key] || (this['props'][key] = default_val);
    };

    /**
     * create_mplib(token:string, config:object, name:string)
     *
     * This function is used by the init method of MixpanelLib objects
     * as well as the main initializer at the end of the JSLib (that
     * initializes document.mixpanel as well as any additional instances
     * declared before this file has loaded).
     */
    var create_mplib = function(token, config, name) {
        var instance, target = (name === PRIMARY_INSTANCE_NAME) ? mixpanel : mixpanel[name];

        if (target && !_.isArray(target)) {
            console.error("You have already initialized " + name);
            return;
        }

        instance = new MixpanelLib();
        instance._init(token, config, name);

        instance['people'] = new MixpanelPeople();
        instance['people']._init(instance);

        // if any instance on the page has debug = true, we set the
        // global debug to be true
        DEBUG = DEBUG || instance.get_config('debug');

        // if target is not defined, we called init after the lib already
        // loaded, so there won't be an array of things to execute
        if (!_.isUndefined(target)) {
            // Crunch through the people queue first - we queue this data up &
            // flush on identify, so it's better to do all these operations first
            instance._execute_array.call(instance['people'], target['people']);
            instance._execute_array(target);
        }

        return instance;
    };

    /**
     * Mixpanel Library Object
     * @constructor
     */
    var MixpanelLib = function() { };

    // Initialization methods

    /**
     * This function initialize a new instance of the Mixpanel tracking object.
     * All new instances are added to the main mixpanel object as sub properties (such as
     * mixpanel.your_library_name) and also returned by this function.  If you wanted
     * to define a second instance on the page you would do it like so:
     *
     *      mixpanel.init("new token", { your: "config" }, "library_name")
     *
     * and use it like this:
     *
     *      mixpanel.library_name.track(...)
     *
     * @param {String} token   Your Mixpanel API token
     * @param {Object} config  A dictionary of config options to override
     * @param {String} name    The name for the new mixpanel instance that you want created
     */
    MixpanelLib.prototype.init = function (token, config, name) {
        if (typeof(name) === "undefined") {
            console.error("You must name your new library: init(token, config, name)");
            return;
        }
        if (name === PRIMARY_INSTANCE_NAME) {
            console.error("You must initialize the main mixpanel object right after you include the Mixpanel js snippet");
            return;
        }

        var instance = create_mplib(token, config, name);
        mixpanel[name] = instance;
        instance._loaded();

        return instance;
    };

    // mixpanel._init(token:string, config:object, name:string)
    //
    // This function sets up the current instance of the mixpanel
    // library.  The difference between this method and the init(...)
    // method is this one initializes the actual instance, whereas the
    // init(...) method sets up a new library and calls _init on it.
    //
    MixpanelLib.prototype._init = function(token, config, name) {
        this['__loaded'] = true;
        this['config'] = {};

        this.set_config(_.extend({}, DEFAULT_CONFIG, config, {
              "name": name
            , "token": token
            , "callback_fn": ((name === PRIMARY_INSTANCE_NAME) ? name : PRIMARY_INSTANCE_NAME + '.' + name) + '._jsc'
        }));

        this['_jsc'] = function() {};

        this.__dom_loaded_queue = [];
        this.__request_queue = [];
        this.__disabled_events = [];
        this._flags = {
              "disable_all_events": false
            , "identify_called": false
        };

        this['cookie'] = new MixpanelCookie(this['config']);
        this.register_once({'distinct_id': _.UUID()}, "");
    };

    // Private methods

    MixpanelLib.prototype._loaded = function() {
        this.get_config('loaded')(this);

        // this happens after so a user can call identify/name_tag in
        // the loaded callback
        if (this.get_config('track_pageview')) {
            this.track_pageview();
        }
    };

    MixpanelLib.prototype._dom_loaded = function() {
        _.each(this.__dom_loaded_queue, function(item) {
            this._track_dom.apply(this, item);
        }, this);
        _.each(this.__request_queue, function(item) {
            this._send_request.apply(this, item);
        }, this);
        delete this.__dom_loaded_queue;
        delete this.__request_queue;
    };

    MixpanelLib.prototype._track_dom = function(DomClass, args) {
        if (this.get_config('img')) {
            console.error("You can't use DOM tracking functions with img = true.");
            return false;
        }

        if (!DOM_LOADED) {
            this.__dom_loaded_queue.push([DomClass, args]);
            return false;
        }

        var dt = new DomClass().init(this);
        return dt.track.apply(dt, args);
    };

    /**
     * _prepare_callback() should be called by callers of _send_request for use
     * as the callback argument.
     *
     * If there is no callback, this returns null.
     * If we are going to make XHR/XDR requests, this returns a function.
     * If we are going to use script tags, this returns a string to use as the
     * callback GET param.
     */
    MixpanelLib.prototype._prepare_callback = function(callback, data) {
        if (_.isUndefined(callback)) {
            return null;
        }

        if (USE_XHR) {
            var callback_function = function(response) {
                callback(response, data);
            };
            return callback_function;
        } else {
            // if the user gives us a callback, we store as a random
            // property on this instances jsc function and update our
            // callback string to reflect that.
            var jsc = this['_jsc']
                , randomized_cb = '' + Math.floor(Math.random() * 100000000)
                , callback_string = this.get_config('callback_fn') + '["' + randomized_cb + '"]';
            jsc[randomized_cb] = function(response) {
                delete jsc[randomized_cb];
                callback(response, data);
            };
            return callback_string;
        }
    };

    MixpanelLib.prototype._send_request = function(url, data, callback) {
        if (ENQUEUE_REQUESTS) {
            this.__request_queue.push(arguments);
            return;
        }

        // needed to correctly format responses
        var verbose_mode = this.get_config('verbose');

        if (this.get_config('test')) { data['test'] = 1; }
        if (verbose_mode) { data['verbose'] = 1; }
        if (this.get_config('img')) { data['img'] = 1; }
        if (!USE_XHR) {
            if (callback) {
                data['callback'] = callback;
            } else if (verbose_mode || this.get_config('test')) {
                // Verbose output (from verbose mode, or an error in test mode) is a json blob,
                // which by itself is not valid javascript. Without a callback, this verbose output will
                // cause an error when returned via jsonp, so we force a no-op callback param.
                // See the ECMA script spec: http://www.ecma-international.org/ecma-262/5.1/#sec-12.4
                data['callback'] = '(function(){})';
            }
        }

        data['ip'] = this.get_config('ip')?1:0;
        data['_'] = new Date().getTime().toString();
        url += '?' + _.HTTPBuildQuery(data);

        if ('img' in data) {
            var img = document.createElement("img");
                img.src = url;
            document.body.appendChild(img);
        } else if (USE_XHR) {
            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            // send the mp_optout cookie
            // withCredentials cannot be modified until after calling .open on Android and Mobile Safari
            req.withCredentials = true;
            req.onreadystatechange = function (e) {
                if (req.readyState === 4) { // XMLHttpRequest.DONE == 4, except in safari 4
                    if (req.status === 200) {
                        if (callback) {
                            if (verbose_mode) { callback(_.JSONDecode(req.responseText)); }
                            else { callback(Number(req.responseText)); }
                        }
                    } else {
                        var error = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                        console.error(error);
                        if (callback) {
                            if (verbose_mode) { callback({ status: 0, error: error }); }
                            else { callback(0); }
                        }
                    }
                }
            };
            req.send(null);
        } else {
            var script = document.createElement("script");
                script.type = "text/javascript";
                script.async = true;
                script.defer = true;
                script.src = url;
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(script, s);
        }
    };

    /**
     * _execute_array() deals with processing any mixpanel function
     * calls that were called before the Mixpanel library were loaded
     * (and are thus stored in an array so they can be called later)
     *
     * Note: we fire off all the mixpanel function calls && user defined
     * functions BEFORE we fire off mixpanel tracking calls.  This is so
     * identify/register/set_config calls can properly modify early
     * tracking calls.
     *
     * @param {Array} array
     */
    MixpanelLib.prototype._execute_array = function(array) {
        var fn_name, alias_calls = [], other_calls = [], tracking_calls = [];
        _.each(array, function(item) {
            if (item) {
                fn_name = item[0];
                if (typeof(item) === "function") {
                    item.call(this);
                } else if (_.isArray(item) && fn_name === 'alias') {
                    alias_calls.push(item);
                } else if (_.isArray(item) && fn_name.indexOf('track') != -1 && typeof(this[fn_name]) === "function") {
                    tracking_calls.push(item);
                } else {
                    other_calls.push(item);
                }
            }
        }, this);

        var execute = function(calls, context) {
            _.each(calls, function(item) {
                this[item[0]].apply(this, item.slice(1));
            }, context);
        };

        execute(alias_calls, this);
        execute(other_calls, this);
        execute(tracking_calls, this);
    };

    /**
     * push() keeps the standard async-array-push
     * behavior around after the lib is loaded.
     * This is only useful for external integrations that
     * do not wish to rely on our convenience methods
     * (created in the snippet). Good example is Optimizely.
     *
     * ### Usage:
     *     mixpanel.push(['register', { a: 'b' }]);
     *
     * @param {Array} item A [function_name, args...] array to be executed
     */
    MixpanelLib.prototype.push = function(item) {
        this._execute_array([item]);
    };

    /**
     * Disable events on the Mixpanel object.  If passed no arguments,
     * this function disables tracking of any event.  If passed an
     * array of event names, those events will be disabled, but other
     * events will continue to be tracked.
     *
     * Note: this function doesn't stop regular mixpanel functions from
     * firing such as register and name_tag.
     *
     * @param {Array} [events] An array of event names to disable
     */
    MixpanelLib.prototype.disable = function(events) {
        if (typeof(events) === 'undefined') {
            this._flags.disable_all_events = true;
        } else {
            this.__disabled_events = this.__disabled_events.concat(events);
        }
    };

    /**
     * Track an event.  This is the most important Mixpanel function and
     * the one you will be using the most.
     *
     * ### Usage:
     *
     *     // track an event named "Registered"
     *     mixpanel.track("Registered", {"Gender": "Male", "Age": 21});
     *
     * For tracking link clicks or form submissions, see mixpanel.track_links or mixpanel.track_forms.
     *
     * @param {String} event_name The name of the event. This can be anything the user does - "Button Click", "Sign Up", "Item Purchased", etc.
     * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
     * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
     */
    MixpanelLib.prototype.track = function(event_name, properties, callback) {
        if (typeof(event_name) === "undefined") {
            console.error("No event name provided to mixpanel.track");
            return;
        }

        if (_.isBlockedUA()
        ||  this._flags.disable_all_events
        ||  _.include(this.__disabled_events, event_name)) {
            if (typeof(callback) !== 'undefined') { callback(0); }
            return;
        }

        // set defaults
        properties = properties || {};
        properties['token'] = properties.token || this.get_config('token');

        // update cookie
        this['cookie'].update_search_keyword(document.referrer);

        if (this.get_config('store_google')) { this['cookie'].update_campaign_params(); }
        if (this.get_config('save_referrer')) { this['cookie'].update_referrer_info(document.referrer); }

        // note: extend writes to the first object, so lets make sure we
        // don't write to the cookie properties object and info
        // properties object by passing in a new object

        // update properties with pageview info and super-properties
        properties = _.extend(
            {}
            , _.info.properties()
            , this['cookie'].properties()
            , properties
        );

        var data = {
              'event': event_name
            , 'properties': properties
        };

        var truncated_data  = _.truncate(data, 255)
            , json_data     = _.JSONEncode(truncated_data)
            , encoded_data  = _.base64Encode(json_data);

        console.log("MIXPANEL REQUEST:");
        console.log(truncated_data);

        this._send_request(
            this.get_config('api_host') + "/track/",
            { 'data': encoded_data },
            this._prepare_callback(callback, truncated_data)
        );

        return truncated_data;
    };

    /**
     * Track a page view event.  This is most useful for ajax websites
     * where new page views occur without a new page load.  This
     * function is called by default on page load unless the
     * track_pageview configuration variable is false.
     *
     * @param {String} [page] The url of the page to record. If you don't include this, it defaults to the current url.
     */
    MixpanelLib.prototype.track_pageview = function(page) {
        if (typeof(page) === "undefined") { page = document.location.href; }
        this.track("mp_page_view", _.info.pageviewInfo(page));
    };

    /**
     * Track clicks on a set of document elements.  Selector must be a
     * valid query. Elements must exist on the page at the time track_links is called.
     *
     * ### Usage:
     *
     *     // track click for link id #nav
     *     mixpanel.track_links("#nav", "Clicked Nav Link");
     *
     * ### Notes:
     *
     * This function will wait up to 300 ms for the Mixpanel
     * servers to respond, if they have not responded by that time
     * it will head to the link without ensuring that your event
     * has been tracked.  To configure this timeout please see the
     * mixpanel.set_config docs below.
     *
     * If you pass a function in as the properties argument, the
     * function will receive the DOMElement which triggered the
     * event as an argument.  You are expected to return an object
     * from the function; any properties defined on this object
     * will be sent to mixpanel as event properties.
     *
     * @type {Function}
     * @param {String} query A valid DOM query
     * @param {String} event_name The name of the event to track
     * @param {Object|Function} [properties] A properties object or function that returns a dictionary of properties when passed a DOMElement
     */
    MixpanelLib.prototype.track_links = function() {
        return this._track_dom.call(this, LinkTracker, arguments);
    };

    /**
     * Tracks form submissions. Selector must be a valid query.
     *
     * ### Usage:
     *
     *     // track submission for form id "register"
     *     mixpanel.track_forms("#register", "Created Account");
     *
     * ### Notes:
     *
     * This function will wait up to 300 ms for the mixpanel
     * servers to respond, if they have not responded by that time
     * it will head to the link without ensuring that your event
     * has been tracked.  To configure this timeout please see the
     * mixpanel.set_config docs below.
     *
     * If you pass a function in as the properties argument, the
     * function will receive the DOMElement which triggered the
     * event as an argument.  You are expected to return an object
     * from the function; any properties defined on this object
     * will be sent to mixpanel as event properties.
     *
     * @type {Function}
     * @param {String} query  A valid DOM query
     * @param {String} event_name The name of the event to track
     * @param {Object|Function} [properties] This can be a set of properties, or a function that returns a set of properties after being passed a DOMElement
     */
    MixpanelLib.prototype.track_forms = function() {
        return this._track_dom.call(this, FormTracker, arguments);
    };

    /**
     * Register a set of super properties, which are included with all
     * events.  This will overwrite previous super property values.
     *
     * @param {Object} properties An associative array of properties to store about the user
     * @param {Number} [days] How many days since the user's last visit to store the super properties
     */
    MixpanelLib.prototype.register = function(props, days) {
        this['cookie'].register(props, days);
    };

    /**
     * Register a set of super properties only once.  This will not
     * overwrite previous super property values, unlike register().
     *
     * ### Notes:
     *
     * If default_value is specified, current super properties
     * with that value will be overwritten.
     *
     * @param {Object} properties An associative array of properties to store about the user
     * @param {*} [default_value] Value to override if already set in super properties (ex: "False") Default: "None"
     * @param {Number} [days] How many days since the users last visit to store the super properties
     */
    MixpanelLib.prototype.register_once = function(props, default_value, days) {
        this['cookie'].register_once(props, default_value, days);
    };

    /**
     * Delete a super property stored with the current user.
     *
     * @param {String} property The name of the super property to remove
     */
    MixpanelLib.prototype.unregister = function(property) {
        this['cookie'].unregister(property);
    };

    MixpanelLib.prototype._register_single = function(prop, value) {
        var props = {};
        props[prop] = value;
        this.register(props);
    };

    /**
     * Identify a user with a unique id.  All subsequent
     * actions caused by this user will be tied to this identity.  This
     * property is used to track unique visitors.  If the method is
     * never called, then unique visitors will be identified by a UUID
     * generated the first time they visit the site.
     *
     * ### Note:
     *
     * You can call this function to overwrite a previously set
     * unique id for the current user.  Mixpanel cannot translate
     * between ids at this time, so when you change a users id
     * they will appear to be a new user.
     *
     * @param {String} unique_id A string that uniquely identifies a user
     */
    MixpanelLib.prototype.identify = function(unique_id, _set_callback, _add_callback, _append_callback, _set_once_callback) {
        // Optional Parameters
        //  _set_callback:function  A callback to be run if and when the People set queue is flushed
        //  _add_callback:function  A callback to be run if and when the People add queue is flushed
        //  _append_callback:function  A callback to be run if and when the People append queue is flushed
        //  _set_once_callback:function  A callback to be run if and when the People set_once queue is flushed

        // identify only changes the distinct id if it doesn't match either the existing or the alias;
        // if it's new, blow away the alias as well.
        if (unique_id != this.get_distinct_id() && unique_id != this.get_property(ALIAS_ID_KEY)) {
            this.unregister(ALIAS_ID_KEY);
            this._register_single('distinct_id', unique_id);
        }
        this._flags.identify_called = true;
        // Flush any queued up people requests
        this['people']._flush(_set_callback, _add_callback, _append_callback, _set_once_callback);
    };

    /**
     * Returns the current distinct id of the user. This is either the id automatically
     * generated by the library or the id that has been passed by a call to mixpanel.identify
     */
    MixpanelLib.prototype.get_distinct_id = function() {
        return this.get_property('distinct_id');
    };

    /**
     * Create an alias. Multiple aliases can map to the same original ID, but not vice-versa.
     * Aliases can also be chained - the following is a valid scenario:
     *
     *      mixpanel.alias("new_id", "existing_id");
     *      ...
     *      mixpanel.alias("newer_id", "new_id");
     *
     * If the original ID is not passed in, we will use the current distinct_id - probably the auto-generated GUID.
     *
     * @param {String} alias A unique identifier that you want to use for this user in the future.
     * @param {String} [original] The current identifier being used for this user.
     */
    MixpanelLib.prototype.alias = function(alias, original) {
        // If the $people_distinct_id key exists in the cookie, there has been a previous
        // mixpanel.people.identify() call made for this user. It is VERY BAD to make an alias with
        // this ID, as it will duplicate users.
        if (alias === this.get_property(PEOPLE_DISTINCT_ID_KEY)) {
            console.critical("Attempting to create alias for existing People user - aborting.");
            return -2;
        }

        var _this = this;
        if (_.isUndefined(original)) {
            original = this.get_distinct_id();
        }
        if (alias !== original) {
            this._register_single(ALIAS_ID_KEY, alias);
            return this.track("$create_alias", { "alias": alias, "distinct_id": original }, function(response) {
                // Flush the people queue
                _this.identify(alias);
            });
        } else {
            console.error("alias matches current distinct_id - skipping api call.");
            this.identify(alias);
            return -1;
        }
    };

    /**
     * Provide a string to recognize the user by.  The string passed to
     * this method will appear in the Mixpanel Streams product rather
     * than an automatically generated name.  Name tags do not have to
     * be unique.
     *
     * This value will only be included in Streams data.
     *
     * @param {String} name_tag A human readable name for the user
     */
    MixpanelLib.prototype.name_tag = function(name_tag) {
        this._register_single('mp_name_tag', name_tag);
    };

    /**
     * Update the configuration of a mixpanel library instance.
     *
     * The default config is:
     *
     *     {
     *       // super properties span subdomains
     *       cross_subdomain_cookie:     true
     *
     *       // super properties cookie name
     *       cookie_name:                ""
     *
     *       // super properties cookie expiration (in days)
     *       cookie_expiration:          365
     *
     *       // should we track a page view on page load
     *       track_pageview:             true
     *
     *       // the amount of time track_links will
     *       // wait for Mixpanel's servers to respond
     *       track_links_timeout:        300
     *
     *       // if this is true, the mixpanel cookie will be deleted,
     *       // and no user persistence will take place
     *       disable_cookie:             false
     *
     *       // if this is true, the mixpanel cookie will be marked as
     *       // secure, meaning it will only be transmitted over https
     *       secure_cookie:              false
     *
     *       // if you set upgrade to be true, the library will check for a
     *       // cookie from our old js library and import super
     *       // properties from it, then the old cookie is deleted
     *       // The upgrade config option only works in the initialization, so
     *       // make sure you set it when you create the library.
     *       upgrade:                    false
     *     }
     *
     *
     * @param {Object} config A dictionary of new configuration values to update
     */
    MixpanelLib.prototype.set_config = function(config) {
        if (_.isObject(config)) {
            _.extend(this['config'], config);
            if (this['cookie']) { this['cookie'].update_config(this['config']); }
            DEBUG = DEBUG || this.get_config('debug');
        }
    };

    /**
     * returns the current config object for the library.
     */
    MixpanelLib.prototype.get_config = function(prop_name) {
        return this['config'][prop_name];
    };

    /**
     * Returns the value of the super property named property_name. If no such
     * property is set, get_property will return the undefined value.
     *
     * @param {String} property_name The name of the super property you want to retrieve
     */
    MixpanelLib.prototype.get_property = function(property_name) {
        return this['cookie']['props'][property_name];
    };

    MixpanelLib.prototype.toString = function() {
        var name = this.get_config("name");
        if (name !== PRIMARY_INSTANCE_NAME) {
            name = PRIMARY_INSTANCE_NAME + "." + name;
        }
        return name;
    };

    /**
     * Mixpanel People Object
     * @constructor
     */
    var MixpanelPeople = function(){ };

    MixpanelPeople.prototype._init = function(mixpanel) {
        this._mixpanel = mixpanel;
    };

    /*
     * Set properties on a user record.
     *
     * ### Usage:
     *
     *     mixpanel.people.set('gender', 'm');
     *
     *     // or set multiple properties at once
     *     mixpanel.people.set({
     *         'company': 'Acme',
     *         'plan': 'Premium',
     *         'last_seen': new Date()
     *     });
     *     // properties can be strings, integers or dates
     *
     * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
     * @param {*} [to] A value to set on the given property name
     * @param {Function} [callback] If provided, the callback will be called after the tracking event
     */
    MixpanelPeople.prototype.set = function(prop, to, callback) {
        var data = {};
        var $set = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                // We will get these ourselves
                if (k == '$distinct_id' || k == '$token') {
                    return;
                } else {
                    $set[k] = v;
                }
            });
            callback = to;
        } else {
            $set[prop] = to;
        }

        // make sure that the referrer info has been updated and saved
        if (this._get_config('save_referrer')) {
            this._mixpanel.cookie.update_referrer_info(document.referrer);
        }

        // update $set object with default people properties
        $set = _.extend({}
            , _.info.people_properties()
            , this._mixpanel.cookie.get_referrer_info()
            , $set
        );

        data[SET_ACTION] = $set;

        return this._send_request(data, callback);
    };

    /*
     * Set properties on a user record, only if they do not yet exist.
     *
     * ### Usage:
     *
     *     mixpanel.people.set_once('First Login Date', new Date());
     *
     *     // or set multiple properties at once
     *     mixpanel.people.set_once({
     *         'First Login Date': new Date(),
     *         'Starting Plan': 'Premium'
     *     });
     *
     *     // properties can be strings, integers or dates
     *
     * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
     * @param {*} [to] A value to set on the given property name
     * @param {Function} [callback] If provided, the callback will be called after the tracking event
     */
    MixpanelPeople.prototype.set_once = function(prop, to, callback) {
        var data = {};
        var $set_once = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                // We will get these ourselves
                if (k == '$distinct_id' || k == '$token') {
                    return;
                } else {
                    $set_once[k] = v;
                }
            });
            callback = to;
        } else {
            $set_once[prop] = to;
        }
        data[SET_ONCE_ACTION] = $set_once;
        return this._send_request(data, callback);
    };

    /*
     * Increment/decrement numeric people analytics properties.
     *
     * ### Usage:
     *
     *     mixpanel.people.increment('page_views', 1);
     *
     *     // or, for convenience, if you're just incrementing a counter by 1, you can
     *     // simply do
     *     mixpanel.people.increment('page_views');
     *
     *     // to decrement a counter, pass a negative number
     *     mixpanel.people.increment('credits_left': -1);
     *
     *     // like mixpanel.people.set(), you can increment multiple properties at once:
     *     mixpanel.people.increment({
     *         counter1: 1,
     *         counter2: 1
     *     });
     *
     * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and numeric values.
     * @param {Number} [by] An amount to increment the given property
     * @param {Function} [callback] If provided, the callback will be called after the tracking event
     */
    MixpanelPeople.prototype.increment = function(prop, by, callback) {
        var data = {};
        var $add = {};
        if (_.isObject(prop)) {
            _.each(prop, function(v, k) {
                if (k == '$distinct_id' || k == '$token') {
                    return;
                } else if (isNaN(parseFloat(v))) {
                    console.error("Invalid increment value passed to mixpanel.people.increment - must be a number");
                    return;
                } else {
                    $add[k] = v;
                }
            });
            callback = by;
        } else {
            // convenience: mixpanel.people.increment('property'); will
            // increment 'property' by 1
            if (_.isUndefined(by)) {
                by = 1;
            }
            $add[prop] = by;
        }
        data[ADD_ACTION] = $add;

        return this._send_request(data, callback);
    };

    /*
     * Append a value to a list-valued people analytics property.
     *
     * ### Usage:
     *
     *     // append a value to a list, creating it if needed
     *     mixpanel.people.append('pages_visited', 'homepage');
     *
     *     // like mixpanel.people.set(), you can append multiple properties at once:
     *     mixpanel.people.append({
     *         list1: 'bob',
     *         list2: 123
     *     });
     *
     * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and numeric values.
     * @param {*} [value] An amount to increment the given property
     * @param {Function} [callback] If provided, the callback will be called after the tracking event
     */
    MixpanelPeople.prototype.append = function(list_name, value, callback) {
        var data = {};
        var $append = {};
        if (_.isObject(list_name)) {
            _.each(list_name, function(v, k) {
                if (k == '$distinct_id' || k == '$token') {
                    return;
                } else {
                    $append[k] = v;
                }
            });
            callback = value;
        } else {
            $append[list_name] = value;
        }
        data[APPEND_ACTION] = $append;

        return this._send_request(data, callback);
    };

    /*
     * Record that you have charged the current user a certain amount
     * of money. Charges recorded with track_charge will appear in the
     * Mixpanel revenue report.
     *
     * ### Usage:
     *
     *     // charge a user $50
     *     mixpanel.people.track_charge(50);
     *
     *     // charge a user $30.50 on the 2nd of january
     *     mixpanel.people.track_charge(30.50, { '$time': new Date('jan 1 2012') });
     *
     * @param {Number} amount The amount of money charged to the current user
     * @param {Object} [properties] An associative array of properties associated with the charge
     * @param {Function} [callback] If provided, the callback will be called when the server responds
     */
    MixpanelPeople.prototype.track_charge = function(amount, properties, callback) {
        if (!_.isNumber(amount)) {
            amount = parseFloat(amount);
            if (isNaN(amount)) {
                console.error("Invalid value passed to mixpanel.people.track_charge - must be a number");
                return;
            }
        }

        return this.append('$transactions', _.extend({
            '$amount': amount
        }, properties), callback);
    };

    /*
     * Permanently clear all revenue report transactions from the
     * current user's people analytics profile.
     *
     * ### Usage:
     *
     *     mixpanel.people.clear_charges();
     *
     * @param {Function} [callback] If provided, the callback will be called after the tracking event
     */
    MixpanelPeople.prototype.clear_charges = function(callback) {
        return this.set('$transactions', [], callback);
    };

    /*
     * Permanently deletes the current people analytics profile from
     * Mixpanel (using the current distinct_id).
     *
     * ### Usage:
     *
     *     // remove the all data you have stored about the current user
     *     mixpanel.people.delete_user();
     *
     */
    MixpanelPeople.prototype.delete_user = function() {
        if (!this._identify_called()) {
            console.error('mixpanel.people.delete_user() requires you to call identify() first');
            return;
        }
        var data = {'$delete': this._mixpanel.get_distinct_id()};
        return this._send_request(data);
    };

    MixpanelPeople.prototype.toString = function() {
        return this._mixpanel.toString() + ".people";
    };

    MixpanelPeople.prototype._send_request = function(data, callback) {
        data['$token'] = this._get_config('token');
        data['$distinct_id'] = this._mixpanel.get_distinct_id();

        var date_encoded_data = _.encodeDates(data)
          , truncated_data    = _.truncate(date_encoded_data, 255)
          , json_data         = _.JSONEncode(date_encoded_data)
          , encoded_data      = _.base64Encode(json_data);

        if (!this._identify_called()) {
            this._enqueue(data);
            if (!_.isUndefined(callback)) {
                if (this._get_config('verbose')) {
                    callback({ status: -1, error: null });
                } else {
                    callback(-1);
                }
            }
            return truncated_data;
        }

        console.log("MIXPANEL PEOPLE REQUEST:");
        console.log(truncated_data);

        this._mixpanel._send_request(
            this._get_config('api_host') + '/engage/',
            { 'data': encoded_data },
            this._mixpanel._prepare_callback(callback, truncated_data)
        );

        return truncated_data;
    };

    MixpanelPeople.prototype._get_config = function(conf_var) {
        return this._mixpanel.get_config(conf_var);
    };

    MixpanelPeople.prototype._identify_called = function() {
        return this._mixpanel._flags.identify_called === true;
    };

    // Queue up engage operations if identify hasn't been called yet.
    MixpanelPeople.prototype._enqueue = function(data) {
        if (SET_ACTION in data) {
            this._mixpanel.cookie._add_to_people_queue(SET_ACTION, data);
        } else if (SET_ONCE_ACTION in data) {
            this._mixpanel.cookie._add_to_people_queue(SET_ONCE_ACTION, data);
        } else if (ADD_ACTION in data) {
            this._mixpanel.cookie._add_to_people_queue(ADD_ACTION, data);
        } else if (APPEND_ACTION in data) {
            this._mixpanel.cookie._add_to_people_queue(APPEND_ACTION, data);
        } else {
            console.error("Invalid call to _enqueue():", data);
        }
    };

    // Flush queued engage operations - order does not matter,
    // and there are network level race conditions anyway
    MixpanelPeople.prototype._flush = function(_set_callback, _add_callback, _append_callback, _set_once_callback) {
        var _this = this,
            $set_queue = _.extend({}, this._mixpanel.cookie._get_queue(SET_ACTION)),
            $set_once_queue = _.extend({}, this._mixpanel.cookie._get_queue(SET_ONCE_ACTION)),
            $add_queue = _.extend({}, this._mixpanel.cookie._get_queue(ADD_ACTION)),
            $append_queue = this._mixpanel.cookie._get_queue(APPEND_ACTION);

        if (!_.isUndefined($set_queue) && _.isObject($set_queue) && !_.isEmptyObject($set_queue)) {
            _this._mixpanel.cookie._pop_from_people_queue(SET_ACTION, $set_queue);
            this.set($set_queue, function(response, data) {
                // on bad response, we want to add it back to the queue
                if (response == 0) {
                    _this._mixpanel.cookie._add_to_people_queue(SET_ACTION, $set_queue);
                }
                if (!_.isUndefined(_set_callback)) {
                    _set_callback(response, data);
                }
            });
        }

        if (!_.isUndefined($set_once_queue) && _.isObject($set_once_queue) && !_.isEmptyObject($set_once_queue)) {
            _this._mixpanel.cookie._pop_from_people_queue(SET_ONCE_ACTION, $set_once_queue);
            this.set_once($set_once_queue, function(response, data) {
                // on bad response, we want to add it back to the queue
                if (response == 0) {
                    _this._mixpanel.cookie._add_to_people_queue(SET_ONCE_ACTION, $set_once_queue);
                }
                if (!_.isUndefined(_set_once_callback)) {
                    _set_once_callback(response, data);
                }
            });
        }

        if (!_.isUndefined($add_queue) && _.isObject($add_queue) && !_.isEmptyObject($add_queue)) {
            _this._mixpanel.cookie._pop_from_people_queue(ADD_ACTION, $add_queue);
            this.increment($add_queue, function(response, data) {
                // on bad response, we want to add it back to the queue
                if (response == 0) {
                    _this._mixpanel.cookie._add_to_people_queue(ADD_ACTION, $add_queue);
                }
                if (!_.isUndefined(_add_callback)) {
                    _add_callback(response, data);
                }
            });
        }

        // we have to fire off each $append individually since there is
        // no concat method server side
        if (!_.isUndefined($append_queue) && _.isArray($append_queue) && $append_queue.length) {
            for (var i = $append_queue.length - 1; i >= 0; i--) {
                var $append_item = $append_queue.pop();
                _this.append($append_item, function(response, data) {
                    if (response == 0) {
                        _this._mixpanel.cookie._add_to_people_queue(APPEND_ACTION, $append_item);
                    }
                    if (!_.isUndefined(_append_callback)) { _append_callback(response, data); }
                });
            };
            // Save the shortened append queue
            _this._mixpanel.cookie.save();
        }
    };

    // EXPORTS (for closure compiler)

    // Underscore Exports
    _['toArray']                                        = _.toArray;
    _['isObject']                                       = _.isObject;
    _['JSONEncode']                                     = _.JSONEncode;
    _['JSONDecode']                                     = _.JSONDecode;
    _['isEmptyObject']                                  = _.isEmptyObject;

    // MixpanelLib Exports
    MixpanelLib.prototype['init']                       = MixpanelLib.prototype.init;
    MixpanelLib.prototype['disable']                    = MixpanelLib.prototype.disable;
    MixpanelLib.prototype['track']                      = MixpanelLib.prototype.track;
    MixpanelLib.prototype['track_links']                = MixpanelLib.prototype.track_links;
    MixpanelLib.prototype['track_forms']                = MixpanelLib.prototype.track_forms;
    MixpanelLib.prototype['track_pageview']             = MixpanelLib.prototype.track_pageview;
    MixpanelLib.prototype['register']                   = MixpanelLib.prototype.register;
    MixpanelLib.prototype['register_once']              = MixpanelLib.prototype.register_once;
    MixpanelLib.prototype['unregister']                 = MixpanelLib.prototype.unregister;
    MixpanelLib.prototype['identify']                   = MixpanelLib.prototype.identify;
    MixpanelLib.prototype['alias']                      = MixpanelLib.prototype.alias;
    MixpanelLib.prototype['name_tag']                   = MixpanelLib.prototype.name_tag;
    MixpanelLib.prototype['set_config']                 = MixpanelLib.prototype.set_config;
    MixpanelLib.prototype['get_config']                 = MixpanelLib.prototype.get_config;
    MixpanelLib.prototype['get_property']               = MixpanelLib.prototype.get_property;
    MixpanelLib.prototype['get_distinct_id']            = MixpanelLib.prototype.get_distinct_id;
    MixpanelLib.prototype['toString']                   = MixpanelLib.prototype.toString;

    // MixpanelCookie Exports
    MixpanelCookie.prototype['properties']              = MixpanelCookie.prototype.properties;
    MixpanelCookie.prototype['update_search_keyword']   = MixpanelCookie.prototype.update_search_keyword;
    MixpanelCookie.prototype['update_referrer_info']    = MixpanelCookie.prototype.update_referrer_info;
    MixpanelCookie.prototype['get_cross_subdomain']     = MixpanelCookie.prototype.get_cross_subdomain;
    MixpanelCookie.prototype['clear']                   = MixpanelCookie.prototype.clear;

    // MixpanelPeople Exports
    MixpanelPeople.prototype['set']                     = MixpanelPeople.prototype.set;
    MixpanelPeople.prototype['set_once']                = MixpanelPeople.prototype.set_once;
    MixpanelPeople.prototype['increment']               = MixpanelPeople.prototype.increment;
    MixpanelPeople.prototype['append']                  = MixpanelPeople.prototype.append;
    MixpanelPeople.prototype['track_charge']            = MixpanelPeople.prototype.track_charge;
    MixpanelPeople.prototype['clear_charges']           = MixpanelPeople.prototype.clear_charges;
    MixpanelPeople.prototype['delete_user']             = MixpanelPeople.prototype.delete_user;
    MixpanelPeople.prototype['toString']                = MixpanelPeople.prototype.toString;

    // Initialization
    if (_.isUndefined(mixpanel)) {
        // mixpanel wasn't initialized properly, report error and quit
        console.critical("'mixpanel' object not initialized. Ensure you are using the latest version of the Mixpanel JS Library along with the snippet we provide.");
        return;
    }
    if (mixpanel['__loaded'] || (mixpanel['config'] && mixpanel['cookie'])) {
        // lib has already been loaded at least once; we don't want to override the global object this time so bomb early
        console.error("Mixpanel library has already been downloaded at least once.");
        return;
    }
    if (SNIPPET_VERSION < 1.1) {
        // mixpanel wasn't initialized properly, report error and quit
        console.critical("Version mismatch; please ensure you're using the latest version of the Mixpanel code snippet.");
        return;
    }

    // Load instances of the Mixpanel Library
    var instances = {};
    _.each(mixpanel['_i'], function(item) {
        var name, instance;
        if (item && _.isArray(item)) {
            name = item[item.length-1];
            instance = create_mplib.apply(this, item);

            instances[name] = instance;
        }
    });

    var extend_mp = function() {
        // add all the sub mixpanel instances
        _.each(instances, function(instance, name) {
            if (name !== PRIMARY_INSTANCE_NAME) { mixpanel[name] = instance; }
        });

        // add private functions as _
        mixpanel['_'] = _;
    };

    // we override the snippets init function to handle the case where a
    // user initializes the mixpanel library after the script loads & runs
    mixpanel['init'] = function(token, config, name) {
        if (name) {
            // initialize a sub library
            if (!mixpanel[name]) {
                mixpanel[name] = instances[name] = create_mplib(token, config, name);
                mixpanel[name]._loaded();
            }
        } else {
            var instance = mixpanel;

            if (instances[PRIMARY_INSTANCE_NAME]) {
                // main mixpanel lib already initialized
                instance = instances[PRIMARY_INSTANCE_NAME];
            } else if (token) {
                // intialize the main mixpanel lib
                instance = create_mplib(token, config, PRIMARY_INSTANCE_NAME);
            }

            window[PRIMARY_INSTANCE_NAME] = mixpanel = instance;
            extend_mp();
        }
    };

    mixpanel['init']();

    // Fire loaded events after updating the window's mixpanel object
    _.each(instances, function(instance) {
        instance._loaded();
    });

    // Cross browser DOM Loaded support

    function dom_loaded_handler() {
        // function flag since we only want to execute this once
        if (dom_loaded_handler.done) { return; }
        dom_loaded_handler.done = true;

        DOM_LOADED = true;
        ENQUEUE_REQUESTS = false;

        _.each(instances, function(inst) {
            inst._dom_loaded();
        });
    }

    if (document.addEventListener) {
        if (document.readyState == "complete") {
            // safari 4 can fire the DOMContentLoaded event before loading all
            // external JS (including this file). you will see some copypasta
            // on the internet that checks for 'complete' and 'loaded', but
            // 'loaded' is an IE thing
            dom_loaded_handler();
        } else {
            document.addEventListener("DOMContentLoaded", dom_loaded_handler, false);
        }
    } else if (document.attachEvent) {
        // IE
        document.attachEvent("onreadystatechange", dom_loaded_handler);

        // check to make sure we arn't in a frame
        var toplevel = false;
        try {
            toplevel = window.frameElement == null;
        } catch(e) {}

        if (document.documentElement.doScroll && toplevel) {
            function do_scroll_check() {
                try {
                    document.documentElement.doScroll("left");
                } catch(e) {
                    setTimeout(do_scroll_check, 1);
                    return;
                }

                dom_loaded_handler();
            };

            do_scroll_check();
        }
    }

    // fallback handler, always will work
    _.register_event(window, 'load', dom_loaded_handler, true);

})(window['mixpanel']);