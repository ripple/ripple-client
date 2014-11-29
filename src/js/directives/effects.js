/**
 * EFFECTS
 *
 * Angular-powered animation and visual effects directives go into this file.
 */

var module = angular.module('effects', []);

/**
 * Animate element creation
 */
module.directive('rpAnimate', function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      if (attrs.rpAnimate !== "rp-animate" && !scope.$eval(attrs.rpAnimate)) return;
      elm = jQuery(elm);
      elm.hide();
      elm.fadeIn(600);
      elm.css('background-color', '#E2F5E4');
      elm.addClass('rp-animate-during rp-animate');
      elm.animate({
        'background-color': '#fff'
      }, {
        duration: 600,
        complete: function () {
          elm.removeClass('rp-animate-during').addClass('rp-animate-after');
        }
      });
    }
  };
});

/**
 * Slide box up or down
 * Usage: div(rp-slide="entry.show")
 */
module.directive('rpSlide', [function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      scope.$watch(attrs.rpSlide, function(value) {
        if (value) {
          element.css('maxHeight', '');
          var height = element.height();
          element.stop().animate(
            {maxHeight: height},
            500,
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
            500
          );
        }
      });
    }
  };
}]);
