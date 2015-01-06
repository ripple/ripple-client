angular
  .module('validators', [])
  .directive('rpAmount', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (value && value.toString().indexOf(",") != -1) {
          value = value.split(",").join("");
        }

        var test = /^(([0-9]*?\.\d+)|([1-9]\d*))$/.test(value);

        if (test && value[0] == '.') {
          value = '0' + value;
        }

        // check for valid amount
        ctrl.$setValidity('rpAmount', test);

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});
