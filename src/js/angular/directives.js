var module = angular.module('directives', []);

module.directive('ngEnter', function() {
  return function(scope, elm, attrs) {
    elm.bind('keypress', function(e) {
      if (e.charCode === 13) scope.$apply(attrs.ngEnter);
    });
  };
});

/**
 * Inline edit
 */
module.directive('inlineEdit', function () {
  var previewTemplate = '<span ng-hide="isEditMode">{{model}}</span>';
  var editTemplate = '<input ng-show="isEditMode" ng-model="model" />';

  return {
    restrict: 'E',
    scope: {
      model: '=',
      isEditMode: '@'
    },
    template: previewTemplate + editTemplate
  };
});

/**
 * Address validator
 */
module.directive('address', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var UInt160 = new ripple.UInt160();

        if (UInt160.parse_json(value)._value) {
          ctrl.$setValidity('address', true);
          return value;
        } else {
          ctrl.$setValidity('address', false);
          return;
        }
      }

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('address', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});