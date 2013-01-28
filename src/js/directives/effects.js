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
