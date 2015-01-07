/**
 * Error message for validator failure.
 *
 * Use this directive within a rp-errors block to show a message for a specific
 * validation failing.
 *
 * @example
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *   </div>
 */
angular
  .module('directives', ['popup'])    
  .directive('rpErrorOn', [function() {
  return {
    transclude: 'element',
    priority: 500,
    compile: function(element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['!' + attrs.rpErrorOn] = transclude;
    }
  };
}]);
