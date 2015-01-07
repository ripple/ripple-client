/**
 * Tooltips
 */
angular
  .module('directives', ['popup'])
  .directive('rpTooltip', [function() {
  return function(scope, element, attr) {
    attr.$observe('rpTooltip', function(value) {
      // Title
      var options = {title: value};

      // Placement
      if (attr.rpTooltipPlacement)
        options.placement = attr.rpTooltipPlacement;

      $(element).tooltip('destroy');
      $(element).tooltip(options);
    });
  };
}]);
