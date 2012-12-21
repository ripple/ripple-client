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
        if (!value || ripple.Seed.is_valid(""+value)) {
          ctrl.$setValidity('rpMasterKey', true);
          return value;
        } else {
          ctrl.$setValidity('rpMasterKey', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpMasterKey', function() {
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

/**
 * Password strength validator
 */
module.directive('rpStrongPassword', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(password) {
        var score = 0;
        var username = ""+scope.username;

        if (!password) {
          scope.strength = '';
          return password;
        }

        // password < 4
        if (password.length < 4 ) {
          ctrl.$setValidity('rpStrongPassword', false);
          scope.strength = 'weak';
          return;
        }

        // password == user name
        if (password.toLowerCase() == username.toLowerCase()) {
          ctrl.$setValidity('rpStrongPassword', false);
          scope.strength = 'weak';
          return;
        }

        checkRepetition = function (pLen, str) {
          var res = "";
          for (var i = 0; i < str.length; i++ ) {
            var repeated = true;

            for (var j = 0; j < pLen && (j+i+pLen) < str.length; j++) {
              repeated = repeated && (str.charAt(j+i) == str.charAt(j+i+pLen));
            }
            if (j<pLen) {
              repeated = false;
            }

            if (repeated) {
              i += pLen-1;
              repeated = false;
            } else {
              res += str.charAt(i);
            }
          }
          return res;
        };

        // password length
        score += password.length * 4;
        score += ( checkRepetition(1, password).length - password.length ) * 1;
        score += ( checkRepetition(2, password).length - password.length ) * 1;
        score += ( checkRepetition(3, password).length - password.length ) * 1;
        score += ( checkRepetition(4, password).length - password.length ) * 1;

        // password has 3 numbers
        if (password.match(/(.*[0-9].*[0-9].*[0-9])/)) {
          score += 5;
        }

        // password has 2 symbols
        if (password.match(/(.*[!,@,#,$,%,&,*,?,_,~].*[!,@,#,$,%,&,*,?,_,~])/)) {
          score += 5;
        }

        // password has Upper and Lower chars
        if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){
          score += 10;
        }

        // password has number and chars
        if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) {
          score += 15;
        }

        //password has number and symbol
        if (password.match(/([!,@,#,$,%,&,*,?,_,~])/) && password.match(/([0-9])/)) {
          score += 15;
        }

        // password has char and symbol
        if (password.match(/([!,@,#,$,%,&,*,?,_,~])/) && password.match(/([a-zA-Z])/)) {
          score += 15;
        }

        // password is just a numbers or chars
        if (password.match(/^\w+$/) || password.match(/^\d+$/) ) {
          score -= 10;
        }

        // verifying 0 < score < 100
        if (score < 0) { score = 0; }
        if (score > 100) { score = 100; }

        if (score < 34) {
          ctrl.$setValidity('rpStrongPassword', false);
          scope.strength = 'weak';
          return;
        }

        ctrl.$setValidity('rpStrongPassword', true);

        if (score < 68) {
          scope.strength = 'medium';
          return password;
        }

        scope.strength = 'strong';
        return password;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpStrongPassword', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});