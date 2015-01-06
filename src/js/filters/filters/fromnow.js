/**
 * Angular filter for Moment.js.
 *
 * Displays a timestamp as "x minutes ago".
 */
var momentCache = {};
angular
  .module('filters', [])
  .filter('rpfromnow', function () {
  return function (input) {
    // This is an expensive function, cache it
    if (!momentCache[input]) momentCache[input] = moment(input).fromNow();

    return momentCache[input];
  };
});
