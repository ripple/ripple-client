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

/**
 * Combobox input element.
 *
 * Adds a autocomplete-like dropdown to an input element.
 *
 * @param {string} rpCombobox Pass a function that takes a string and returns
 *   the matching autocompletions.
 */
module.directive('rpCombobox', [function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, el, attrs, ngModel) {
      el.wrap('<div class="rp-combobox">');
      var cplEl = $('<ul class="completions"></ul>').hide();
      el.parent().append(cplEl);

      // Listen for keyup events to enable binding
      el.keyup(function() {
        var match = ngModel.$viewValue;
        var re = new RegExp('('+match+')', 'i');

        var completions = match.length ? scope.$eval(attrs.rpCombobox)(match) : [];

        // By fading out without updating the completions we get a smoother effect
        if (!completions.length) {
          setVisible(false);
          return;
        }

        cplEl.empty();
        completions.forEach(function (val) {
          val = val.replace(re, '<u>$1</u>');
          var completion = $('<li>'+val+'</li>');
          el.parent().find('.completions').append(completion);
        });
        el.parent().addClass('active');
        setVisible(!!cplEl.children().length);
      });

      el.focus(function() {
        setVisible(!!cplEl.children().length);
      });

      el.blur(function() {
        setVisible(false);
      });

      function setVisible(to) {
        cplEl[to ? 'fadeIn' : 'fadeOut']('fast');
      }

      cplEl.on('click', 'li', function () {
        var val = $(this).text();
        scope.$apply(function () {
          el.val(val);
          ngModel.$setViewValue(val);
        });
      });
    }
  };
}]);
