/**
 * Slide box up or down
 * Usage: div(rp-slide="entry.show")
 */
angular
  .module('effects', [])
  .directive('rpSlide', [function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      scope.$watch(attrs.rpSlide, function(value, oldValue) {
        // don't animate on initialization
        if (value === oldValue) {
          if (value) {
            element.css('maxHeight', '');
          }
          else {
            element.css({
              maxHeight: 0,
              overflow: 'hidden'
            });
          }
          return;
        }
        if (value) {
          element.css('maxHeight', '');
          var height = element.height();
          element.stop().animate(
            {maxHeight: height},
            350,
            function () {
              // remove maxHeight and overflow after animation completes
              element.css('maxHeight', '');
              element.css('overflow', '');
            }
          );
        }
        else {
          element.css({
            maxHeight: element.height(),
            overflow: 'hidden'
          });
          element.stop().animate(
            {maxHeight: 0},
            350
          );
        }
      });
    }
  };
}]);
