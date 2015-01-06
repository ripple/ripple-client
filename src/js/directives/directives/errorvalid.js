/**
 * Message for field valid.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * valid.
 */
angular
  .module('directives', ['popup'])    
  .directive('rpErrorValid', [function() {
  return {
    transclude: 'element',
    priority: 500,
    compile: function(element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['+'] = transclude;
    }
  };
}]);
