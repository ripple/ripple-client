/**
 * Return object properties.
 * Used in trade tab to make My Orders list sortable.
 */
angular
  .module('filters', [])
  .filter('rpvalues', function () {
  return function (items_object) {
    var values = _.values(items_object);
    return _.values(items_object);
  }
});
