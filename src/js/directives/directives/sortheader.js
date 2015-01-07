/**
 * My Orders widget header.
 */
angular
  .module('directives', ['popup'])
  .directive('rpOrdersSortHeader', ['$timeout', '$parse', function($timeout, $parse) {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        if (!attr.rpOrdersSortHeaderField) {
          // no field specified, do nothing
          return;
        }
        var sortFieldGetter = $parse(attr.rpOrdersSortHeader);
        var sortReverse = $parse(attr.rpOrdersSortHeaderReverse);
        var fieldName = attr.rpOrdersSortHeaderField;

        function drawArrow() {
          var sfv = sortFieldGetter(scope);
          if (sfv == fieldName) {
            element.find('span').addClass('sorted');
            element.find('span').html(!sortReverse(scope) ? '&#x25B2;' : '&#x25BC;');
          }
        }
        drawArrow();

        var watcher = scope.$watch(attr.rpOrdersSortHeader, function() {
          if (sortFieldGetter(scope) != fieldName) {
            element.find('span').removeClass('sorted');
            element.find('span').html('&#x25BC;');
          }
        });
        var watcher2 = scope.$watch(attr.rpOrdersSortHeaderReverse, drawArrow);

        function updateSort() {
          var sfv = sortFieldGetter(scope);
          if (sfv != fieldName) {
            sortFieldGetter.assign(scope, fieldName);
            sortReverse.assign(scope, true);
//            element.find('span').html('&#x25B2;');
            element.find('span').html('&#x25BC;');
            element.find('span').addClass('sorted');
          } else {
            var reverseNow = sortReverse(scope);
            sortReverse.assign(scope, !reverseNow);
          }
        }

        element.click(function(e) {
          scope.$apply(updateSort);
        });

        // Make sure  is destroyed and removed.
        scope.$on('$destroy', function() {
          // Remove watcher
          watcher();
          watcher2();
        });
      };
    }
  };
}]);
