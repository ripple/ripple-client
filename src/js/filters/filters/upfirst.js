/**
 * Uppercase the first letter.
 */

module.filter('rpucfirst', function () {
  return function (str) {
    str = ""+str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
});
