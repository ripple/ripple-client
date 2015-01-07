/**
 * Crops a string to len characters
 *
 * The number of the bullets will correspond to the length of the string.
 */
angular
  .module('filters', [])
  .filter('rptruncate', function () {
  return function (str, len) {
    return str ? str.slice(0, len) : '';
  };
});
