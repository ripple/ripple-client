/**
 * VALIDATORS
 *
 * Form validation directives go into this file.
 */

var webutil = require('../client/webutil');

var module = angular.module('validators', []);

/**
 * Address validator
 */
module.directive('rpAddress', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var UInt160 = new ripple.UInt160();

        if (UInt160.parse_json(value)._value) {
          ctrl.$setValidity('rpAddress', true);
          return value;
        } else {
          ctrl.$setValidity('rpAddress', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpAddress', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Master key validator
 */
module.directive('rpMasterKey', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var Amount = new ripple.Amount();

        if (Amount.parse_json(value)._value) {
          ctrl.$setValidity('rpAddress', true);
          return value;
        } else {
          ctrl.$setValidity('rpAddress', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpAddress', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Address or contact validator
 *
 * Allows a valid address or a contact in our addressbook.
 */
// TODO merge rpDestination, rpAddress and rpNotMe.
module.directive('rpDestination', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var UInt160 = new ripple.UInt160();

        if (UInt160.parse_json(value)._value || webutil.getContact(scope.userBlob.data.contacts,value)) {
          ctrl.$setValidity('rpDestination', true);
          return value;
        } else {
          ctrl.$setValidity('rpDestination', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpDestination', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Destination validator
 *
 * Allows a valid address or a contact in our addressbook.
 */
module.directive('rpNotMe', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var contact = webutil.getContact(scope.userBlob.data.contacts,value);

        if (value) {
          if ((contact && contact.address == scope.userBlob.data.account_id) || scope.userBlob.data.account_id == value) {
            ctrl.$setValidity('rpNotMe', false);
            return;
          }
        }

        ctrl.$setValidity('rpNotMe', true);
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpNotMe', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

module.directive('rpIssuer', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if(!value){
          ctrl.$setValidity('rpIssuer', false);
          return;
        }

        var shortValue = value.slice(0, 3).toUpperCase();

        if ( (shortValue==="XRP") || webutil.findIssuer(scope.lines,shortValue)) 
        {
          ctrl.$setValidity('rpIssuer', true);
          return value;
        } else {
          ctrl.$setValidity('rpIssuer', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpIssuer', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Verify a form is the same as another.
 *
 * For example you could use this as a password repeat validator.
 *
 * @example
 *   <input name=password type=password>
 *   <input name=password2 type=password rp-same-as=password>
 */
module.directive('rpSameAs', [function() {
  return {
    require: 'ngModel',
    link: function(scope, el, attr, ctrl) {
      var pwdWidget = el.inheritedData('$formController')[attr.rpSameAs];

      ctrl.$parsers.unshift(function(value) {
        if (value === pwdWidget.$viewValue) {
          ctrl.$setValidity('rpSameAs', true);
          return value;
        }
        ctrl.$setValidity('rpSameAs', false);
      });

      pwdWidget.$parsers.unshift(function(value) {
        ctrl.$setValidity('rpSameAs', value === ctrl.$viewValue);
        return value;
      });
    }
  };
}]);

/**
 * Field uniqueness validator.
 *
 * @param {array=} rpUnique Array of strings which are disallowed values.
 * @param {string=} rpUniqueField If set, rpUnique will be interpreted as an
 *   array of objects and we compare the value with the field named
 *   rpUniqueField inside of those objects.
 * @param {string=} rpUniqueOrig You can set this to the original value to
 *   ensure this value is always allowed.
 *
 * @example
 *   <input ng-model="name" ng-unique="addressbook" ng-unique-field="name">
 */
module.directive('rpUnique', function() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function ($scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var array = $scope.$eval(attr.rpUnique);

        if (attr.rpUniqueOrig && value === $scope.$eval(attr.rpUniqueOrig)) {
          // Original value is always allowed
          ctrl.$setValidity('rpUnique', true);
        } else if (attr.rpUniqueField) {
          for (var i = 0, l = array.length; i < l; i++) {
            if (array[i][attr.rpUniqueField] === value) {
              ctrl.$setValidity('rpUnique', false);
              return undefined;
            }
          }
          ctrl.$setValidity('rpUnique', true);
        } else {
          ctrl.$setValidity('rpUnique', array.indexOf(value) === -1);
        }
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('required', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
