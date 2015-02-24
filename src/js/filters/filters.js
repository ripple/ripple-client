var module = angular.module('filters', []),
    webutil = require('../util/web'),
    Amount = ripple.Amount,
    Currency = ripple.Currency,
    Base = ripple.Base;

var currencies = require('../data/currencies');
/**
 * Format a ripple.Amount.
 *
 * If the parameter is a number, the number is treated the relative
 */
module.filter('rpamount', function() {
  return function (input, options) {

    var currency;
    var opts = jQuery.extend(true, {}, options);

    if ('number' === typeof opts) {
      opts = {
        rel_min_precision: opts
      };
    } else if ('object' !== typeof opts) {
      opts = {};
    }

    if (!input) return "n/a";

    if (opts.xrp_human && input === ("" + parseInt(input, 10))) {
      input = input + ".0";
    }

    var origPrecision = opts.precision;

    // Reference date
    // XXX Should maybe use last ledger close time instead
    if (!opts.reference_date && !opts.no_interest) {
      opts.reference_date = new Date();
    }

    // if hard_precision is true, do not allow precision & min_precision to be overridden
    if (! opts.hard_precision && input._is_native) {
      // If XRP, then set standard precision here
      currency = currencies[0].standard_precision;
      opts.min_precision = currency;
      opts.precision = currency;
    }

    var amount = Amount.from_json(input);

    if (!amount.is_valid()) return "n/a";

    if (opts.force_precision) {
      opts.precision = opts.force_precision;
      return amount.to_human(opts);
    }
    // if abs_precision is passed, bypass entire currency look up (for loop - expensive)
    if (opts.abs_precision) {
      opts.min_precision = opts.abs_precision;
      opts.precision = opts.abs_precision;

      return amount.to_human(opts);
    }

    if (! opts.hard_precision) {
      // Currency default precision
      for (var i = 0; i < currencies.length; i++) {
        if (currencies[i].value === amount.currency().to_human()) {
          currency = currencies[i].standard_precision;

          // Default standard precision per currency is taken from currencies.js
          opts.min_precision = currency;
          opts.precision = currency;
          break;
        }
      }
    }

    var amtHuman = amount.to_human();
    if ((amtHuman < 0.01 && amtHuman > 0) ||
      ("number" === typeof opts.tiny_precision && amtHuman < 0.1)) {
        // We attempt to show the entire number, by setting opts.precision to a high number... 100
      // opts.precision = 100;
      // quick fix. Amount.to_human uses Number.toFixed, which throws RangeError for values larger then 20.
      opts.precision = 15;
    }

    var cdp = ("undefined" !== typeof currency) ? currency : 4;
    // Certain formatting options are relative to the currency default precision
    if ("number" === typeof opts.rel_precision) {
      opts.precision = cdp + opts.rel_precision;
    }
    if ("number" === typeof opts.rel_min_precision) {
      opts.min_precision = cdp + opts.rel_min_precision;
    }

    // But we will cut off after five significant decimals
    // if ("number" !== typeof opts.max_sig_digits) {
    //   opts.max_sig_digits = 30;
    // }

    var out = amount.to_human(opts);

    // tiny_precision is for tiny numbers e.g a value of 5 would format:
    // 0.000000000012866401 as
    // 0.000000000012866
    if ("number" === typeof opts.tiny_precision) {
      var reformat = false;
      var outs = out.split('.');

      if (+outs[0].replace(',','') >= 1) {
        // if integer is not zero, format with original precision
        if (opts.hard_precision) {
          opts.precision = origPrecision;
          reformat = true;
        }
      }
      else {
        // if integer is zero, format the fraction with tiny_precision number of digits
        // after any leading zeros
        var frac = outs[1];

        if (frac && frac.length > opts.tiny_precision) {
          var regex = /^0*/;
          var res = regex.exec(frac);
          var leadZeros = res[0].length;

          if (leadZeros) {
            opts.precision = leadZeros + opts.tiny_precision;
            reformat = true;
          }
        }
      }

      if (reformat) out = amount.to_human(opts);
    }

      // If amount is very small and only has zeros (ex. 0.0000), raise precision
      // to make it useful.
      // if (out.length > 1 && 0 === +out && !opts.hard_precision) {
      //   opts.precision = 5;

      //   out = amount.to_human(opts);
      // }

    return out;
  };
});

/**
 * Get the currency from an Amount or Currency object.
 *
 * If the input is neither an Amount or Currency object it will be passed to
 * Amount#from_json to try to interpret it.
 */
module.filter('rpcurrency', function() {
  return function (input) {
    if (!input) return "";

    var currency;
    if (input instanceof Currency) {
      currency = input;
    } else {
      var amount = Amount.from_json(input);
      currency = amount.currency();
    }

    return currency.to_human();
  };
});

/**
 * Get the currency issuer.
 */
module.filter('rpissuer', function() {
  return function (input) {
    if (!input) return "";

    var amount = Amount.from_json(input);
    if (!amount.is_valid()) return "";
    if (!amount.issuer().is_valid()) return "";
    return amount.issuer().to_json();
  };
});

/**
 * Get the full currency name from an Amount.
 */
module.filter('rpcurrencyfull', ['$rootScope', function ($scope) {
  return function (input) {
    if (!input) return "";

    var amount = Amount.from_json(input);
    var currency = $.grep($scope.currencies_all, function(e){ return e.value == amount.currency().to_human(); })[0];

    if (currency) {
      return currency.name;
    } else {
      return amount.currency().to_human();
    }
  };
}]);

/**
 * Calculate a ratio of two Amounts.
 */
module.filter('rpamountratio', function() {
  return function (numerator, denominator) {
    try {
      return Amount.from_json(numerator).ratio_human(denominator, {reference_date: new Date()});
    } catch (err) {
      return Amount.NaN();
    }
  };
});

/**
 * Calculate the sum of two Amounts.
 */
module.filter('rpamountadd', function() {
  return function (a, b) {
    try {
      b = Amount.from_json(b);
      if (b.is_zero()) return a;
      return Amount.from_json(a).add(b);
    } catch (err) {
      return Amount.NaN();
    }
  };
});
/**
 * Calculate the difference of two Amounts.
 */
module.filter('rpamountsubtract', function() {
  return function (a, b) {
    try {
      return Amount.from_json(a).subtract(b);
    } catch (err) {
      return Amount.NaN();
    }
  };
});

/**
 * Angular filter for Moment.js.
 *
 * Displays a timestamp as "x minutes ago".
 */
var momentCache = {};

module.filter('rpfromnow', function() {
  return function (input) {
    // This is an expensive function, cache it
    if (!momentCache[input]) momentCache[input] = moment(input).fromNow();

    return momentCache[input];
  };
});

/**
 * Show Ripple Name
 *
 * Shows a ripple name for a given ripple address
 */
module.filter("rpripplename", ['$rootScope', '$http', 'rpId', function($scope, $http, id) {
  return function(address, options) {
    var ripplename = id.resolveNameSync(address, options);
    if (ripplename !== address) {
      return ripplename;
    }
    if (address.length > 21) {
      return address.substring(0, 7) + "…";
    }
    return address;
  }
}]);

/**
 * Show contact name or address
 */
module.filter('rpcontactname', ['$rootScope', function ($scope) {
  return function (address) {
    address = address ? ""+address : "";

    var contact = webutil.getContact($scope.userBlob.data.contacts, address);

    if (!contact) {
      return address.substring(0, 7) + "…";
    }

    return contact.name;
  };
}]);

module.filter('rpcontactnamefull', ['$rootScope', function ($scope) {
  return function (address) {
    address = address ? ""+address : "";
    var contact = webutil.getContact($scope.userBlob.data.contacts, address);

    if (!contact) {
      return "" + address;
    }

    return contact.name;
  };
}]);

module.filter('rponlycontactname', ['$rootScope', function ($scope) {
  return function (address) {
    address = address ? ""+address : "";

    var contact = webutil.getContact($scope.userBlob.data.contacts, address);

    if (contact) {
      return contact.name;
    }
  };
}]);

/**
 * Masks a string like so: •••••.
 *
 * The number of the bullets will correspond to the length of the string.
 */
module.filter('rpmask', function() {
  return function (pass) {
    pass = ""+pass;
    return Array(pass.length+1).join("•");
  };
});

/**
 * Crops a string to len characters
 *
 * The number of the bullets will correspond to the length of the string.
 */
module.filter('rptruncate', function() {
  return function (str, len) {
    return str ? str.slice(0, len) : '';
  };
});

/**
 * Format a file size.
 *
 * Based on code by aioobe @ StackOverflow.
 * @see http://stackoverflow.com/questions/3758606
 */
module.filter('rpfilesize', function() {
  function number_format( number, decimals, dec_point, thousands_sep ) {
    // http://kevin.vanzonneveld.net
    // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +     bugfix by: Michael White (http://crestidg.com)
    // +     bugfix by: Benjamin Lupton
    // +     bugfix by: Allan Jensen (http://www.winternet.no)
    // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // *     example 1: number_format(1234.5678, 2, '.', '');
    // *     returns 1: 1234.57

    var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
    var d = dec_point === undefined ? "," : dec_point;
    var t = thousands_sep === undefined ? "." : thousands_sep, s = n < 0 ? "-" : "";
    var i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10) + "", j = (j = i.length) > 3 ? j % 3 : 0;

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  }

  // SI (International System of Units)
  // e.g. 1000 bytes = 1 kB
  var unit = 1000;
  var prefixes = "kMGTPE";
  var common = "B";

  // Binary system
  // e.g. 1024 bytes = 1 KiB
  //var unit = 1024
  //var prefixes = "KMGTPE";
  //var common = "iB";

  return function (str) {
    var bytes = +str;
    if (bytes < unit) return bytes + " B";
    var exp = Math.floor(Math.log(bytes) / Math.log(unit));
    var pre = " "+prefixes[exp-1] + common;
    return number_format(bytes / Math.pow(unit, exp), 2, '.', '')+pre;
  };
});

/**
 * Uppercase the first letter.
 */
module.filter('rpucfirst', function() {
  return function (str) {
    str = ""+str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
});

/**
 * Something similar to javascript for loop
 *
 * Usage
 * Example1 : ng-repeat="n in [20] | rprange"
 * Example2 : ng-repeat="n in [10, 35] | rprange"
 */
module.filter('rprange', function() {
  return function(input) {
    var lowBound, highBound;
    switch (input.length) {
      case 1:
        lowBound = 0;
        highBound = parseInt(input[0], 10) - 1;
        break;
      case 2:
        lowBound = parseInt(input[0], 10);
        highBound = parseInt(input[1], 10);
        break;
      default:
        return input;
    }
    var result = [];
    for (var i = lowBound; i <= highBound; i++)
      result.push(i);
    return result;
  };
});

module.filter('rpaddressorigin', function() {
  return function(recipient) {
    if (~recipient.indexOf('@')) return 'federation';
    return !isNaN(Base.decode_check([0, 5], recipient, 'bitcoin')) ? 'bitcoin' : 'ripple';
  };
});

module.filter('rpheavynormalize', function() {
  return function (value, maxLength) {
    return String(value)
      // Remove non-printable and non-ASCII characters
      .replace(/[^ -~]/g, '')
      // Enforce character limit
      .substr(0, maxLength || 160)
      // Remove leading whitespace
      .replace(/^\s+/g, '')
      // Remove trailing whitespace
      .replace(/\s+$/g, '')
      // Normalize all other whitespace
      .replace(/\s+/g, ' ');
  };
});

/**
 * Used to filter My Orders on trade tab.
 */
module.filter('rpcurrentpair', function() {
  return function (items, doFilter, currentKey) {
    if (!doFilter) {
      return items;
    }

    return _.pick(items, function(order, okey, object) {
      var first_currency = order.first.currency();
      var first_issuer = order.first.issuer().to_json();
      var second_currency = order.second.currency();
      var second_issuer = order.second.issuer().to_json();

      var key = "" +
        first_currency.to_json() +
        (first_currency.is_native() ? "" : "/" + first_issuer) +
        ":" +
        second_currency._iso_code +
        (second_currency.is_native() ? "" : "/" + second_issuer);

      return key == currentKey;
    });
  }
});

/**
 * Return object properties.
 * Used in trade tab to make My Orders list sortable.
 */
module.filter('rpvalues', function() {
  return function (items_object) {
    var values = _.values(items_object);
    return _.values(items_object);
  }
});

/**
 * My Orders widget sorting filter.
 */
module.filter('rpsortmyorders', function() {
  return function (items_object, field, reverse) {
    var arrayCopy = items_object.slice(0);
    arrayCopy.sort(function(a, b) {
      var res = 0;
      switch(field) {
        case 'qty':
          //res = a.first.compareTo(b.first);
          // Amount.compareTo doesn't compare XRP and non-XRP
          res = a.first.to_number() - b.first.to_number();
          break;
        case 'limit':
          var now = new Date();
          var ar = Amount.from_json(a.second).ratio_human(a.first, {reference_date: now});
          var br = Amount.from_json(b.second).ratio_human(b.first, {reference_date: now});
          //res = ar.compareTo(br);
          res = ar.to_number() - br.to_number();
          break;
        case 'type':
          res = a.type.localeCompare(b.type) ;
          break;
        case 'base':
          res = a.first.currency().to_json().localeCompare(b.first.currency().to_json());
          break;
        case 'counter':
          res = a.second.currency().to_json().localeCompare(b.second.currency().to_json());
          break;
        case 'time':
          break;
        default:
      }
      if (reverse) {
        res *= -1;
      }
      return res;
    });
    return arrayCopy;
  }
});

/**
 * Contacts sorting filter
 */
module.filter('rpsortcontacts', function() {
  return function (items_object, field, reverse) {
    var arrayCopy = items_object.slice(0);
    arrayCopy.sort(function(a, b) {
      var res = 0;
      switch(field) {
        case 'contact':
          res = a.name.localeCompare(b.name);
          break;
        case 'address':
          res = a.address.localeCompare(b.address);
          break;
        default:
      }
      if (reverse) {
        res *= -1;
      }
      return res;
    });
    return arrayCopy;
  }
});
