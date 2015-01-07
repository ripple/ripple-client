/**
 * Group of validation errors for a form field.
 *
 * @example
 *   <input name=send_destination ng-model=recipient>
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-valid>{{recipient}} is a valid destination.</div>
 *   </div>
 */
var RP_ERRORS = 'rp-errors';
angular
  .module('directives', ['popup'])
  .directive('rpErrors', [function() {
  return {
    restrict: 'EA',
    compile: function(el, attr, linker) {
      var fieldName = attr.rpErrors || attr.on,
        errs = {};

      el.data(RP_ERRORS, errs);
      return function(scope, el) {
        var formController = el.inheritedData('$formController');
        var formName = formController.$name,
          selectedTransclude,
          selectedElement,
          selectedScope;

        function updateErrorTransclude() {
          var field = formController[fieldName];

          if (!field) return;

          var $error = field && field.$error;

          if (selectedElement) {
            selectedScope.$destroy();
            selectedElement.remove();
            selectedElement = selectedScope = null;
          }

          // Pristine fields should show neither success nor failure messages
          if (field.$pristine) return;

          // Find any error messages defined for current errors
          selectedTransclude = false;
          $.each(errs, function(validator, transclude) {
            if (validator.length <= 1) return;
            if ($error && $error[validator.slice(1)]) {
              selectedTransclude = transclude;
              return false;
            }
          });

          // Show message for valid fields
          if (!selectedTransclude && errs['+'] && field.$valid) {
            selectedTransclude = errs['+'];
          }

          // Generic message for invalid fields when there is no specific msg
          if (!selectedTransclude && errs['?'] && field.$invalid) {
            selectedTransclude = errs['?'];
          }

          if (selectedTransclude) {
            scope.$eval(attr.change);
            selectedScope = scope.$new();
            selectedTransclude(selectedScope, function(errElement) {
              selectedElement = errElement;
              el.append(errElement);
            });
          }
        }

        scope.$watch(formName + '.' + fieldName + '.$error', updateErrorTransclude, true);
        scope.$watch(formName + '.' + fieldName + '.$pristine', updateErrorTransclude);
      };
    }
  };
}]);
