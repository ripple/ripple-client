/**
 * Limit currencies to be entered
 */
angular
  .module('validators', [])
  .directive('rpRestrictCurrencies', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var match = /^([a-zA-Z0-9]{3}|[A-Fa-f0-9]{40})\b/.exec(value);

        if (attr.rpRestrictCurrencies) {
          if (match) {
            ctrl.$setValidity('rpRestrictCurrencies',
              attr.rpRestrictCurrencies.indexOf(match[1]) != -1
                ? true
                : value === 'XRP'
            );
          } else {
            ctrl.$setValidity('rpRestrictCurrencies', false);
          }
        }
        else {
          ctrl.$setValidity('rpRestrictCurrencies', true);
        }

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});
