var module = angular.module('filters', []),
    webutil = require('../util/web'),
    Amount = ripple.Amount,
    Base = ripple.Base;

var iso4217 = require('../data/iso4217');

/**
 * Format a ripple.Amount.
 *
 * If the parameter is a number, the number is treated the relative
 */
module.filter('rpamount', function () {
  return function (input, options) {
    opts = jQuery.extend(true, {}, options);

    if ("number" === typeof opts) {
      opts = {
        rel_min_precision: opts
      };
    } else if ("object" !== typeof opts) {
      opts = {};
    }

    if (!input) return "n/a";

    if (opts.xrp_human && input === ("" + parseInt(input, 10))) {
      input = input + ".0";
    }

    var amount = Amount.from_json(input);
    if (!amount.is_valid()) return "n/a";

    // Currency default precision
    var currency = iso4217[amount.currency().to_json()];
    var cdp = ("undefined" !== typeof currency) ? currency[1] : 4;

    // Certain formatting options are relative to the currency default precision
    if ("number" === typeof opts.rel_precision) {
      opts.precision = cdp + opts.rel_precision;
    }
    if ("number" === typeof opts.rel_min_precision) {
      opts.min_precision = cdp + opts.rel_min_precision;
    }

    // If no precision is given, we'll default to max precision.
    if ("number" !== typeof opts.precision) {
      opts.precision = 16;
    }

    // But we will cut off after five significant decimals
    if ("number" !== typeof opts.max_sig_digits) {
      opts.max_sig_digits = 5;
    }

    var out = amount.to_human(opts);

    // If amount is very small and only has zeros (ex. 0.0000), raise precision
    // to make it useful.
    if (out.length > 1 && 0 === +out && !opts.hard_precision) {
      opts.precision = 20;

      out = amount.to_human(opts);
    }

    return out;
  };
});

/**
 * Get the currency from an Amount.
 */
module.filter('rpcurrency', function () {
  return function (input) {
    if (!input) return "";

    var amount = Amount.from_json(input);
    return amount.currency().to_json();
  };
});

/**
 * Get the currency issuer.
 */
module.filter('rpissuer', function () {
  return function (input) {
    if (!input) return "";

    var amount = Amount.from_json(input);
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
    var currency = $.grep($scope.currencies_all, function(e){ return e.value == amount.currency().to_json(); })[0];

    if (currency) {
      return currency.name;
    } else {
      return amount.currency().to_json();
    }
  };
}]);

/**
 * Calculate a ratio of two Amounts.
 */
module.filter('rpamountratio', function () {
  return function (numerator, denominator) {
    try {
      return Amount.from_json(numerator).ratio_human(denominator);
    } catch (err) {
      return Amount.NaN();
    }
  };
});

/**
 * Calculate the sum of two Amounts.
 */
module.filter('rpamountadd', function () {
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
module.filter('rpamountsubtract', function () {
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
module.filter('rpfromnow', function () {
  return function (input) {
    return moment(input).fromNow();
  };
});

/**
 * Show contact name or short address
 */
module.filter('rpcontactname', ['$rootScope', function ($scope) {
  return function (address) {
    address = address ? ""+address : "";

    var contact = webutil.getContact($scope.userBlob.data.contacts, address);

    if (!contact) {
      return "" + address.substring(0,7) + "…";
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
module.filter('rpmask', function () {
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
module.filter('rptruncate', function () {
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
module.filter('rpfilesize', function () {
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
module.filter('rpucfirst', function () {
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
    return !isNaN(Base.decode_check([0, 5], recipient, 'bitcoin')) ? 'bitcoin' : 'ripple';
  };
});

module.filter('rpheavynormalize', function () {
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
