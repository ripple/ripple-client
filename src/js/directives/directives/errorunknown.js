/**
 * Message for no matched validator failures.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * invalid, but there was no error message defined for any of the failing
 * validators.
 *
 * @example
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-unknown>Invalid value.</div>
 *   </div>
 */
angular
  .module('directives', ['popup'])    
  .directive('rpErrorUnknown', [function() {
  return {
    transclude: 'element',
    priority: 500,
    compile: function(element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['?'] = transclude;
    }
  };
}]);
