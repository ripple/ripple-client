/**
 * Format a file size.
 *
 * Based on code by aioobe @ StackOverflow.
 * @see http://stackoverflow.com/questions/3758606
 */
angular
  .module('filters', [])
  .filter('rpfilesize', function () {
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
