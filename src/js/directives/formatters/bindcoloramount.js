angular
  .module('formatters', ['domainalias'])
  .directive('rpBindColorAmount', function () {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.$watch(attr.rpBindColorAmount, function(value){
          if (value) {
            var parts = value.split(".");

            if (parts.length === 2) { // you never know
              var decimalPart = parts[1].replace(/(0+)$/, '<span class="insig">$1</span>');
              decimalPart = '<span class="decimalPart">.' + decimalPart + '</span>';

              element[0].innerHTML = decimalPart.length > 0 ? parts[0] + decimalPart : parts[0];
            }
          }
        });
      };
    }
  };
});
