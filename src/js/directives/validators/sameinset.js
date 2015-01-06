/**
 * Verify a set of inputs have the same value.
 *
 * For example you could use this as a password repeat validator.
 *
 * @example
 *   <input name=password type=password rp-same-in-set="passwordSet">
 *   <input name=password2 type=password rp-same-in-set="passwordSet">
 */
angular
  .module('validators', [])
  .directive('rpSameInSet', [function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var set = scope.$eval(attrs.rpSameInSet);

      function validator(value) {
        var oldValue = value !== ctrl.$modelValue
          ? ctrl.$modelValue
          : (value !== ctrl.$viewValue ? ctrl.$viewValue : value);
        if (value !== oldValue) {
          set[oldValue] = (set[oldValue] || 1) - 1;
          if (set[oldValue] === 0) {
            delete set[oldValue];
          }
          if (value) {
            set[value] = (set[value] || 0) + 1;
          }
        }
        return value;
      }

      ctrl.$formatters.push(validator);
      ctrl.$parsers.push(validator);

      scope.$watch(
        function() {
          return _.size(set) === 1;
        },
        function(value){
          ctrl.$setValidity('rpSameInSet', value);
        }
      );
    }
  };
}]);
