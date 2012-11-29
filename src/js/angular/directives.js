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

/**
 * Password and repeat validator
 */
module.directive('passValidate', function() {
  var noop = function() {};

  var nullFormCtrl = {
    isNull: true,
    $addControl: noop,
    $removeControl: noop,
    $setValidity: noop,
    $setDirty: noop
  };

  return {
    restrict: 'A',
    require: '^form', // Looks on parent also

    link: function(scope, element, attrs, parentFormCtrl) {
      var modelCtrl = { $name: attrs.name || attrs.mwName },
          nameExp = attrs.nameExp,
          validateExpr = attrs.passValidate;

      var $error = this.$error = {}; // keep invalid keys here

      parentFormCtrl = parentFormCtrl || nullFormCtrl ;

      validateExpr = scope.$eval(validateExpr);

      if ( ! validateExpr) {
        return;
      }

      if (angular.isFunction(validateExpr)) {
        validateExpr = { validator: validateExpr };
      }

      // TODO Is necessary?
      parentFormCtrl.$addControl(modelCtrl);

      element.bind('$destroy', function() {
        parentFormCtrl.$removeControl(modelCtrl);
      });

      if ( nameExp ) {
        scope.$watch( nameExp, function( newValue ) {
          modelCtrl.$name = newValue;
        });
      }

      scope.xxxform = parentFormCtrl;
      // Register watches
      angular.forEach(validateExpr, function(validExp, validationErrorKey) {
        // Check for change in "boolean" value (true or false)
        scope.$watch( '(' + validExp + ') && true', function(newIsValid, oldIsValid) {
          if ( ($error[validationErrorKey] || false) === newIsValid) {
            $error[validationErrorKey] = ! newIsValid;

            parentFormCtrl.$setValidity(validationErrorKey, newIsValid, modelCtrl);
          }
        });
      });
    }
  };
});
