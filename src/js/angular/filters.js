var module = angular.module('filters', []),
    webutil = require('../client/webutil'),
    Amount = ripple.Amount;

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
    if (!opts.precision) opts.precision = 0;

    if (!input) return "n/a";

    var amount = Amount.from_json(input);
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

    var name = webutil.getContact(rippleclient.$scope.userBlob.data.contacts,address);

    if (!name) {
      name =  "" + address.substring(0,7) + "&hellip;";
    }

    return name.name;
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
