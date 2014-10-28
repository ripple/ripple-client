/**
 * Description: Combines 2 arrays removing duplicates based on a object key
 * @param arr1: Array of objects
 * @param arr2: Array of objects
 * @param key:  object key to be unique
 *
 * @return array of unique objects based on key
 */
exports.uniqueObjArray = function(arr1, arr2, key) {
  var obj = {};
  _.each(arr1, function(v) {
    obj[v[key]] = v;
  });

  _.each(arr2, function(v) {
    if (!(v[key] in obj)) {
      obj[v[key]] = v;
    }
  });

  return _.values(obj);
};
