var webutil = require('../client/webutil');

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
 * Address validator
 */
// TODO code duplication. see 'address' directive
module.directive('account', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var UInt160 = new ripple.UInt160();

        if (UInt160.parse_json(value)._value || scope.getContact(value)) {
          ctrl.$setValidity('account', true);
          return value;
        } else {
          ctrl.$setValidity('account', false);
          return;
        }
      }

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('account', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

module.directive('issuer', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if(!value){
          ctrl.$setValidity('issuer', false);
          return;
        }
        
        var shortValue = value.slice(0, 3).toUpperCase();
         
        if ( (shortValue==="XRP") || webutil.findIssuer(scope.lines,shortValue)) 
        {
          ctrl.$setValidity('issuer', true);
          return value;
        } else {
          ctrl.$setValidity('issuer', false);
          return;
        }
      }

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('issuer', function() {
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
 * Animate element creation
 */
module.directive('animate', function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm = jQuery(elm);
      elm.hide();
      elm.fadeIn(600);
      elm.css('background-color', '#E2F5E4');
      elm.animate({
        'background-color': '#fff'
      }, {duration: 600})
    }
  };
})
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
      var keyCursor = -1;

      el.wrap('<div class="rp-combobox">');
      var cplEl = $('<ul class="completions"></ul>').hide();
      el.parent().append(cplEl);

      // Explicit select button
      if (attrs.rpComboboxSelect) {
        var selectEl = $('<div>').appendTo(el.parent());
        selectEl.addClass('select');
        selectEl.mousedown(function (e) {
          e.preventDefault();
        });
        selectEl.click(function () {
          setCompletions(scope.$eval(attrs.rpCombobox)());
          if (cplEl.is(':visible')) {
            el.blur();
          } else {
            setCompletions(scope.$eval(attrs.rpCombobox)());
            el.focus();
          }
        });
      }

      // Listen for keyup events to enable binding
      el.keyup(function(e) {
        if (e.which >= 37 && e.which <= 40) return;
        if (e.which === 13) return;

        updateCompletions();
      });

      el.keydown(function (e) {
        if (e.which === 38 || e.which === 40) {
          if (!cplEl.children().length) {
            updateCompletions();
          }
          e.preventDefault();

          if (e.which === 38) keyCursor--;
          else keyCursor++;

          updateKeyCursor();
        } else if (e.which === 13) {
          e.preventDefault();

          var curEl = cplEl.find('li.cursor');
          if (curEl.length === 1) {
            selectCompletion(curEl);
          }
        }
      });

      el.focus(function() {
        keyCursor = -1;
        setVisible(!!cplEl.children().length);
      });

      el.blur(function() {
        setVisible(false);
      });

      cplEl.mousedown(function (e) {
        e.preventDefault();
      });

      function setVisible(to) {
        el.parent()[to ? 'addClass' : 'removeClass']('active');
        cplEl[to ? 'fadeIn' : 'fadeOut']('fast');
      }

      function updateCompletions() {
        var match = ngModel.$viewValue;
        var re = new RegExp('('+match+')', 'i');

        var completions = match.length ? scope.$eval(attrs.rpCombobox)(match) : [];

        // By fading out without updating the completions we get a smoother effect
        if (!completions.length) {
          setVisible(false);
          return;
        }

        setCompletions(completions, re);
        setVisible(!!cplEl.children().length);
      }

      function setCompletions(completions, re) {
        cplEl.empty();
        keyCursor = -1;
        completions.forEach(function (val) {
          if (re) val = val.replace(re, '<u>$1</u>');
          var completion = $('<li>'+val+'</li>');
          el.parent().find('.completions').append(completion);
        });
      }

      function updateKeyCursor() {
        var opts = cplEl.find('li');
        keyCursor = Math.max(keyCursor, 0);
        keyCursor = Math.min(keyCursor, opts.length - 1);
        opts.removeClass('cursor');
        opts.eq(keyCursor).addClass('cursor');
      }

      function selectCompletion(liEl) {
        var val = $(liEl).text();
        scope.$apply(function () {
          el.val(val);
          ngModel.$setViewValue(val);
          setVisible(false);
        });
      }

      cplEl.on('click', 'li', function () {
        selectCompletion(this);
      });
    }
  };
}]);
