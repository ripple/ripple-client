var Amount = ripple.Amount;
/**
 * Format a ripple.Amount.
 *
 * If the parameter is a number, the number is treated the relative
 */
var currencies = require('../../data/currencies');
angular
  .module('filters', [])
  .filter('rpamount', function () {
  return function (input, options) {

    var currency;
    var opts = jQuery.extend(true, {}, options);

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
        opts.precision = 100;
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
