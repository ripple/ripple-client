/**
 * VALIDATORS
 *
 * Form validation directives go into this file.
 */

var webutil = require('../util/web'),
    Base58Utils = require('../util/base58'),
    Amount = ripple.Amount;

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
        if (value) {
          var address = ripple.UInt160.from_json(value);

          if (!address.is_valid()) {
            ctrl.$setValidity('rpAddress', false);
            return;
          }
        }

        ctrl.$setValidity('rpAddress', true);
        return value;
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
 * Secret Account Key validator
 */
module.directive('rpMasterKey', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (value && !Base58Utils.decode_base_check(33, value)) {
          ctrl.$setValidity('rpMasterKey', false);
          return;
        }

        ctrl.$setValidity('rpMasterKey', true);
        return value;
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
        var strippedValue=webutil.stripRippleAddress(value);
        var address = ripple.UInt160.from_json(strippedValue);

        if (address.is_valid() || (scope.userBlob && webutil.getContact(scope.userBlob.data.contacts,strippedValue))) {
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
 * Source and destination tags validator
 *
 * Integer in the range 0 to 2^32-1
 */
module.directive('rpStdt', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (!value || (!isNaN(parseFloat(value)) && isFinite(value) && value >= 0 && value < Math.pow(2,32) - 1)) {
          ctrl.$setValidity('rpStdt', true);
          return value;
        } else {
          ctrl.$setValidity('rpStdt', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpStdt', function() {
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
 * Verify a set of inputs have the same value.
 *
 * For example you could use this as a password repeat validator.
 *
 * @example
 *   <input name=password type=password rp-same-in-set="passwordSet">
 *   <input name=password2 type=password rp-same-in-set="passwordSet">
 */
module.directive('rpSameInSet', [function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      var set = scope.$eval(attrs.rpSameInSet);

      function validator(value) {
        var oldValue = value !== ctrl.$modelValue
            ? ctrl.$modelValue
            : (value !== ctrl.$viewValue ? ctrl.$viewValue : value);
        if (value !== oldValue) {
          set[oldValue] = (set[oldValue] || 1) - 1;
          if (set[oldValue] === 0) {
            delete set[oldValue];
          }
          if (value) {
            set[value] = (set[value] || 0) + 1;
          }
        }
        return value;
      }

      ctrl.$formatters.push(validator);
      ctrl.$parsers.push(validator);

      scope.$watch(
          function() {
            return _.size(set) == 1;
          },
          function(value){
            ctrl.$setValidity('rpSameInSet', value);
          }
      );
    }
  }
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
        var pool = $scope.$eval(attr.rpUnique) || [];

        if (attr.rpUniqueOrig && value === $scope.$eval(attr.rpUniqueOrig)) {
          // Original value is always allowed
          ctrl.$setValidity('rpUnique', true);
        } else if (attr.rpUniqueField) {
          for (var i = 0, l = pool.length; i < l; i++) {
            if (pool[i][attr.rpUniqueField] === value) {
              ctrl.$setValidity('rpUnique', false);
              return;
            }
          }
          ctrl.$setValidity('rpUnique', true);
        } else {
          ctrl.$setValidity('rpUnique', pool.indexOf(value) === -1);
        }
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      $scope.$watch(attr.rpUnique, function () {
        validator(ctrl.$viewValue);
      }, true);
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

        // password < 6
        if (password.length < 6 ) {
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

/**
 * Maximum amount of money user can send
 */
module.directive('rpMaxAmount', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var input = Amount.from_human(+value);

        var currency = attr.rpMaxAmountCurrency ? attr.rpMaxAmountCurrency.slice(0, 3).toUpperCase() : 'XRP';

        // Check for XRP only
        if (currency != 'XRP') {
          ctrl.$setValidity('rpMaxAmount', true);
          return value;
        }

        if (input.is_valid()
            && scope.account.max_spend
            && scope.account.max_spend.to_number() > 1
            && scope.account.max_spend.compareTo(input) >= 0) {
          ctrl.$setValidity('rpMaxAmount', true);
          return value;
        } else {
          ctrl.$setValidity('rpMaxAmount', false);
          return value;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      scope.$watch('account.max_spend', function () {
        validator(ctrl.$viewValue);
      }, true);

      attr.$observe('rpMaxAmount', function() {
        validator(ctrl.$viewValue);
      });

      attr.$observe('rpMaxAmountCurrency', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Amount validator
 */
module.directive('rpPositiveAmount', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        ctrl.$setValidity('rpAmount', false);

        // check for valid and positive amount
        var parsedValue = parseFloat(value);
        if (parsedValue == value && parsedValue > 0) {
          ctrl.$setValidity('rpAmount', true);

          // XRP limit is 100 bln
          if (attr.currency && attr.currency.toLowerCase() === 'xrp')
            ctrl.$setValidity('rpXrpLimit', parsedValue < 100000000000);

          return parsedValue;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});

/**
 * Port number validator
 */
module.directive('rpPortNumber', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        ctrl.$setValidity('rpPortNumber', (parseInt(value,10) == value && value >= 1 && value <= 65535));
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpPortNumber', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Hostname validator
 * IPv4, IPv6 and hostname
 */
module.directive('rpHostname', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      function validate(str) {
        var test = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(str);
        return test;
      }

      var validator = function(value) {
        ctrl.$setValidity('rpHostname', validate(value));
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpHostname', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

