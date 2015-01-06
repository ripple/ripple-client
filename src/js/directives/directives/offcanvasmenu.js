angular
  .module('directives', ['popup'])
  .directive('rpOffCanvasMenu', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.find('h2').click(function () {
        element.parent().toggleClass('off-canvas-nav-expand');
      });
    }
  };
});
