/**
 * DIRECTIVES
 *
 * Miscellaneous directives go in this file.
 */

var module = angular.module('directives', []);

/**
 * Inline edit
 */
module.directive('inlineEdit', function () {
  var previewTemplate = '<span ng-hide="mode">{{model}}</span>';
  var editTemplate = '<input ng-show="mode" ng-model="model" />';

  return {
    restrict: 'E',
    scope: {
      model: '=',
      mode: '='
    },
    template: previewTemplate + editTemplate
  };
});

/*
 * Defines the rp-if tag. This removes/adds an element from the dom depending on a condition
 * Originally created by @tigbro, for the @jquery-mobile-angular-adapter
 * https://github.com/tigbro/jquery-mobile-angular-adapter
 */
module.directive('rpIf', [function () {
  return {
    transclude: 'element',
    priority: 1000,
    terminal: true,
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, iterStartElement, attr) {
        iterStartElement[0].doNotMove = true;
        var expression = attr.rpIf;
        var lastElement;
        var lastScope;
        scope.$watch(expression, function (newValue) {
          if (lastElement) {
            lastElement.remove();
            lastElement = null;
          }
          if (lastScope) {
            lastScope.$destroy();
            lastScope = null;
          }
          if (newValue) {
            lastScope = scope.$new();
            linker(lastScope, function (clone) {
              lastElement = clone;
              iterStartElement.after(clone);
            });
          }
          // Note: need to be parent() as jquery cannot trigger events on comments
          // (angular creates a comment node when using transclusion, as ng-repeat does).
          iterStartElement.parent().trigger("$childrenChanged");
        });
      };
    }
  };
}]);

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
module.directive('rpErrors', [function () {
  return {
    restrict: 'EA',
    compile: function (element, attr, linker) {
      var fieldName = attr.rpErrors || attr.on,
          errs = {};

      element.data(RP_ERRORS, errs);
      return function (scope, el) {
        var formController = element.inheritedData('$formController'),
            formName = formController.$name,
            selectedTransclude,
            selectedElement,
            selectedScope;

        scope.$watch(formName+'.'+fieldName+'.$error', function ($error) {
          var field = formController[fieldName];

          if (selectedElement) {
            selectedScope.$destroy();
            selectedElement.remove();
            selectedElement = selectedScope = null;
          }

          // Pristine fields should show neither success nor failure messages
          if (field.$pristine) return;

          // Find any error messages defined for current errors
          selectedTransclude = false;
          $.each(errs, function (validator, transclude) {
            if (validator.length <= 1) return;
            if ($error[validator.slice(1)]) {
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
              element.append(errElement);
            });
          }
        }, true);
      };
    }
  };
}]);

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
module.directive('rpErrorOn', [function () {
  return {
    transclude: 'element',
    priority: 500,
    compile: function (element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['!' + attrs.rpErrorOn] = transclude;
    }
  };
}]);

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
module.directive('rpErrorUnknown', [function () {
  return {
    transclude: 'element',
    priority: 500,
    compile: function (element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['?'] = transclude;
    }
  };
}]);

/**
 * Message for field valid.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * valid.
 */
module.directive('rpErrorValid', [function () {
  return {
    transclude: 'element',
    priority: 500,
    compile: function (element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['+'] = transclude;
    }
  };
}]);

