/**
 * Field uniqueness validator.
 *
 * @param {array=} rpUnique Array of strings which are disallowed values.
 * @param {string=} rpUniqueField If set, rpUnique will be interpreted as an
 *   array of objects and we compare the value with the field named
 *   rpUniqueField inside of those objects.
 * @param {string=} rpUniqueOrig You can set this to the original value to
 *   ensure this value is always allowed.
 * @param {string=} rpUniqueGroup @ref rpUniqueScope
 *
 * @example
 *   <input ng-model="name" rp-unique="addressbook" rp-unique-field="name">
 */
angular
  .module('validators', [])
  .directive('rpUnique', function() {
  var globalGroups = {};
  var bind = function(callback) {
    return function(args) {
      return callback.apply(this, args);
    };
  };
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function ($scope, elm, attr, ctrl) {
      if (!ctrl) return;
      var group;
      if (attr.rpUniqueGroup) {
        var groups;
        groups = elm.inheritedData(RP_UNIQUE_SCOPE) || globalGroups;
        if (!groups[attr.rpUniqueGroup]) groups[attr.rpUniqueGroup] = [];
        group = groups[attr.rpUniqueGroup];
        group.push([$scope, elm, attr, ctrl]);
      } else {
        group = [[$scope, elm, attr, ctrl]];
      }

      var setResult = function(result) {
        _.forEach(group, bind(function($scope, elm, attr, ctrl){
          ctrl.$setValidity('rpUnique', result);
        }));
      };

      // makes undefined == ''
      var checkValue = function(a, b) {
        if (a === b) return true;
        if ((a === null || a === undefined || a === '') &&
          (b === null || b === undefined || b === '')) return true;
        return false;
      };

      var validator = function(value) {
        var thisCtrl = ctrl;
        var pool = $scope.$eval(attr.rpUnique) || [];
        var orig = _.every(group, bind(function($scope, elm, attr, ctrl){
          return attr.rpUniqueOrig && checkValue(ctrl === thisCtrl ? value : ctrl.$viewValue, $scope.$eval(attr.rpUniqueOrig));
        }));
        if (orig) {
          // Original value is always allowed
          setResult(true);
        } else if (attr.rpUniqueField) {
          var check = function (i){
            return _.every(group, bind(function($scope, elm, attr, ctrl){
              return checkValue(pool[i][attr.rpUniqueField], ctrl === thisCtrl ? value : ctrl.$viewValue);
            }));
          };
          for (i = 0, l = pool.length; i < l; i++) {
            if (check(i)) {
              setResult(false);
              return value;
            }
            setResult(true);
          }
        } else {
          ctrl.$setValidity('rpUnique', pool.indexOf(value) === -1);
        }

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      $scope.$watch(attr.rpUnique, function () {
        validator(ctrl.$viewValue);
      }, true);
    }
  };
});
