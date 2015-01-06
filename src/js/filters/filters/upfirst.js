/**
 * Uppercase the first letter.
 */
angular
  .module('filters', [])
  .filter('rpucfirst', function () {
  return function (str) {
    str = ""+str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
});
