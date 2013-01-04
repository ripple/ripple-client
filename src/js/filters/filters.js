var module = angular.module('filters', []),
    webutil = require('../client/webutil'),
    Amount = ripple.Amount;

var iso4217 = require('../data/iso4217');

/**
 * Format a ripple.Amount.
 */
module.filter('rpamount', function () {
  return function (input, opts) {
    if ("number" === typeof opts) {
      opts = {
        precision: opts
      };
    } else if ("object" !== typeof opts) {
      opts = {};
    }

    if (!input) return "n/a";

    var amount = Amount.from_json(input);
    if (!amount.is_valid()) return "n/a";

    var currency = amount.currency().to_json();
    if ("number" !== typeof opts.precision) {
      // If no precision is given, we'll default to the currency's default
      // precision.
      opts.precision = ("undefined" !== typeof iso4217[currency]) ?
        iso4217[currency][1] : 2;
    }

    var out = amount.to_human(opts);

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
 * Calculate a ratio of two Amounts.
 */
module.filter('rpamountratio', function () {
  return function (numerator, denominator) {
    if (!(numerator instanceof ripple.Amount)) return Amount.NaN();
    if (!(denominator instanceof ripple.Amount)) return Amount.NaN();

    return numerator.ratio_human(denominator);
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
module.filter('rpcontactname', function () {
  return function (address) {
    address = address ? ""+address : "";

    var contact = webutil.getContact(rippleclient.$scope.userBlob.data.contacts,address);

    if (!contact) {
      return "" + address.substring(0,7) + "…";
    }

    return contact.name;
  };
});

module.filter('rpcontactnamefull', function () {
  return function (address) {
    address = address ? ""+address : "";

    var contact = webutil.getContact(rippleclient.$scope.userBlob.data.contacts,address);

    if (!contact) {
      return "" + address;
    }

    return contact.name;
  };
});

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
