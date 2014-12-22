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

/**
 * Shrink zoom until contents fits into 1 line
 * Usage: div(rp-auto-zoom, rp-auto-zoom-ref=".amount")
 * Ref is the height of the child element to compare to,
 * in order to find out if the text is wrapping to >1 lines
 */
module.directive('rpAutoZoom', [function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var $el     = $(element),
          $parent = $el.parent(),
          $ref    = $el.find(attrs.rpAutoZoomRef),
          i = 0,
          render  = function () {
            if (i++ > 999999) return; // prevent infinite loops
            var heightRef   = $ref.height(),
                heightElem  = $el.height(),
                widthParent = $parent.width(),
                currentZoom = $el.css('zoom'),
                widthElem   = 0;
            // add all child node widths to find out width
            $el.children().each(function (){
              widthElem += $(this).width();
            });
            if (!currentZoom) {
              currentZoom = 1;
            }
            widthElem *= currentZoom;
            // is element wrapping?
            if (heightElem > heightRef   // wraps in >1 lines
              || widthElem > widthParent // width overflow
            ) {
              // shrink zoom, then retry
              currentZoom *= 0.95;
              $el.css('zoom', currentZoom);
              render();
            }
          },
          // don't render the zoom too often
          startRenderTimeout = null,
          startRender = function () {
            startRenderTimeout = null;
            $el.css('zoom', '');
            render();
          },
          startRenderDelayed = function () {
            if (startRenderTimeout) {
              clearTimeout(startRenderTimeout);
            }
            startRenderTimeout = setTimeout(startRender, 100);
          };
      // render when text content changes
      scope.$watch(
        function () { return $(element).text(); },
        function (newValue, oldValue) {
          if (newValue !== oldValue) {
            startRenderDelayed();
          }
        }
      );
      // render when window size changes
      $(window).resize(startRenderDelayed);
    }
  };
}]);
