/**
 * Secret Account Key validator
 */
angular
  .module('validators', [])
  .directive('rpMasterKey', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (value && !Base.decode_check(33, value)) {
          ctrl.$setValidity('rpMasterKey', false);
          return;
        }

        ctrl.$setValidity('rpMasterKey', true);
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpMasterKey', function() {
        validator(ctrl.$viewAValue);
      });
    }
  };
});
