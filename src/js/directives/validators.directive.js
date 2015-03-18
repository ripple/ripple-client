/**
 * VALIDATORS
 *
 * Form validation directives go into this file.
 */

var webutil = require('../util/web'),
  Base = ripple.Base,
  Amount = ripple.Amount,
  Currency = ripple.Currency;

var module = angular.module('validators', []);

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
        if (value && !Base.decode_check(33, value)) {
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

/*
 * Invalidate duplicate accountId's
 * consider the masterkey invalid unless the database does not have the derived accountId
 */
module.directive('rpMasterAddressExists', function ($q, $timeout, $http) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      ctrl.$asyncValidators.rpMasterAddressExists = function(value) {
        if (!value || !Base.decode_check(33, value)) {
          return $q.when(true);
        } else if (value) {
          var accountId = ripple.Seed.from_json(value).get_key().get_address().to_json(),
              defer = $q.defer();

          $timeout(function() {
            rippleVaultClient.AuthInfo.get(Options.domain, accountId, function(err, data) {
              if (err) {
                defer.reject();
              }

              if (data.username) {
                scope.masterkeyUsername = data.username;
                scope.masterkeyAddress  = accountId;
                defer.reject();
              } else {
                defer.resolve();
              }
            });
          }, 500);

          return defer.promise;
        }
      };

      attr.$observe('rpMasterAddressExists', function() {
        ctrl.$validate();
      });
    }
  };
});

/**
 * Validate a payment destination.
 *
 * You can set this validator and one or more of the type attributes:
 *
 * - rp-dest-address          - If set, allows Ripple addresses as destinations.
 * - rp-dest-contact          - If set, allows address book contacts.
 * - rp-dest-bitcoin          - If set, allows Bitcoin addresses as destinations.
 * - rp-dest-email            - If set, allows federation/email addresses.
 * - rp-dest-check-federation - If set, check federation address for validity.
 * - rp-dest-ripple-name      - If set, allows Existing ripple name as destination.
 * - rp-dest-model            - If set, updates the model with the resolved ripple address.
 *
 * If the input can be validly interpreted as one of these types, the validation
 * will succeed.
 */
module.directive('rpDest', ['$q', '$timeout', '$parse', 'rpFederation', function ($q, $timeout, $parse, $federation) {
  var emailRegex = /^\S+@\S+\.[^\s.]+$/;
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var getter;
      ctrl.$asyncValidators.rpDest = function(value) {
        var strippedValue = webutil.stripRippleAddress(value),
            address = ripple.UInt160.from_json(strippedValue);

        ctrl.rpDestType = null;
        if (attr.rpDestFederationModel) {
          getter = $parse(attr.rpDestFederationModel);
          getter.assign(scope,null);
        }

        // client-side validation
        if (attr.rpDestAddress && address.is_valid()) {
          ctrl.rpDestType = "address";

          if (attr.rpDestModel) {
            getter = $parse(attr.rpDestModel);
            getter.assign(scope,value);
          }

          return $q.when(true);
        }

        if (attr.rpDestContact && scope.userBlob &&
          webutil.getContact(scope.userBlob.data.contacts,strippedValue)) {
          ctrl.rpDestType = "contact";

          if (attr.rpDestModel) {
            getter = $parse(attr.rpDestModel);
            getter.assign(scope,webutil.getContact(scope.userBlob.data.contacts,strippedValue).address);
          }

          return $q.when(true);
        }

        if (attr.rpDestBitcoin && !isNaN(Base.decode_check([0, 5], strippedValue, 'bitcoin'))) {
          ctrl.rpDestType = "bitcoin";

          if (attr.rpDestModel) {
            getter = $parse(attr.rpDestModel);
            getter.assign(scope,value);
          }

          return $q.when(true);
        }

        // server-side validation
        if (attr.rpDestEmail && emailRegex.test(strippedValue)) {
          ctrl.rpDestType = "email";
          if (attr.rpDestCheckFederation) {
            return $federation.check_email(value)
              .then(function (result) {
                // Check if this request is still current, exit if not
                if (value != ctrl.$viewValue) return;

                if (attr.rpDestModel) {
                  getter = $parse(attr.rpDestModel);
                  getter.assign(scope,value);
                }
                if (attr.rpDestFederationModel) {
                  getter = $parse(attr.rpDestFederationModel);
                  getter.assign(scope,result);
                }
                return true;
              }, function() {
                return false;
              });
          } else {
            if (attr.rpDestModel) {
              getter = $parse(attr.rpDestModel);
              getter.assign(scope,value);
            }

            return $q.when(true);
          }
        }

        if (((attr.rpDestRippleName && webutil.isRippleName(value)) ||
          (attr.rpDestRippleNameNoTilde && value && value[0] !== '~' && webutil.isRippleName('~'+value)))) { // TODO Don't do a client check in validators
          ctrl.rpDestType = "rippleName";

          var defer = $q.defer();
          $timeout(function() {
            rippleVaultClient.AuthInfo.get(Options.domain, value, function(err, info){
              scope.$apply(function(){
                if (attr.rpDestModel && info.exists) {
                  getter = $parse(attr.rpDestModel);
                  getter.assign(scope,info.address);
                }

                if (info.exists) {
                  defer.resolve(info.exists);
                } else {
                  defer.reject();
                }
              });
            });
          }, 500);
          return defer.promise;
        }

        return $q.reject(false);
      };

      attr.$observe('rpDest', function() {
        ctrl.$validate();
      });
    }
  };
}]);

/**
 * Check if the ripple name is valid and is available for use
 */
module.directive('rpAvailableName', function ($q, $timeout, $parse) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      ctrl.$asyncValidators.rpAvailableName = function(value) {
        scope.usernameInvalidReason = '';
        scope.usernameReservedFor = '';

        if (!value) {
          // No name entered, show nothing, do nothing
          return $q.when(true);
        } else if (value.length < 2) {
          scope.usernameInvalidReason = 'tooshort';
        } else if (value.length > 20) {
          scope.usernameInvalidReason = 'toolong';
        } else if (!/^[a-zA-Z0-9\-]+$/.exec(value)) {
          scope.usernameInvalidReason = 'charset';
        } else if (/^-/.exec(value)) {
          scope.usernameInvalidReason = 'starthyphen';
        } else if (/-$/.exec(value)) {
          scope.usernameInvalidReason = 'endhyphen';
        } else if (/--/.exec(value)) {
          scope.usernameInvalidReason = 'multhyphen';
        } else {
          var defer = $q.defer();
          $timeout(function(){
            rippleVaultClient.AuthInfo.get(Options.domain, value, function(err, info){
              scope.$apply(function(){
                if (info.exists) {
                  scope.usernameInvalidReason = 'exists';
                  defer.reject('exists');
                } else if (info.reserved) {
                  scope.usernameInvalidReason = 'reserved';
                  scope.usernameReservedFor = info.reserved;
                  defer.reject('reserved');
                } else {
                  defer.resolve();
                }
              });
            });
          }, 500);

          return defer.promise;
        }
        return $q.when(false);
      };
      attr.$observe('rpAvailableName', function(val) {
        ctrl.$validate();
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

/**
 * InvoiceID validator
 *
 * String must not be longer than 64 characters
 */
module.directive('rpInvoiceId', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (!value || value.length <= 64) {
          ctrl.$setValidity('rpInvoiceId', true);
          return value;
        } else {
          ctrl.$setValidity('rpInvoiceId', false);
          return;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpInvoiceId', function() {
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
          if ((contact && contact.address === scope.userBlob.data.account_id) || scope.userBlob.data.account_id === value) {
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
          return _.size(set) === 1;
        },
        function(value){
          ctrl.$setValidity('rpSameInSet', value);
        }
      );
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
 * @param {string=} rpUniqueGroup @ref rpUniqueScope
 *
 * @example
 *   <input ng-model="name" rp-unique="addressbook" rp-unique-field="name">
 */
module.directive('rpUnique', function() {
  var globalGroups = {};
  var bind = function(callback) {
    return function(args) {
      return callback.apply(this, args);
    };
  };
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function ($scope, elm, attr, ctrl) {
      if (!ctrl) return;
      var group;
      if (attr.rpUniqueGroup) {
        var groups;
        groups = elm.inheritedData(RP_UNIQUE_SCOPE) || globalGroups;
        if (!groups[attr.rpUniqueGroup]) groups[attr.rpUniqueGroup] = [];
        group = groups[attr.rpUniqueGroup];
        group.push([$scope, elm, attr, ctrl]);
      } else {
        group = [[$scope, elm, attr, ctrl]];
      }

      var setResult = function(result) {
        _.forEach(group, bind(function($scope, elm, attr, ctrl){
          ctrl.$setValidity('rpUnique', result);
        }));
      };

      // makes undefined == ''
      var checkValue = function(a, b) {
        if (a === b) return true;
        if ((a === null || a === undefined || a === '') &&
          (b === null || b === undefined || b === '')) return true;
        return false;
      };

      var validator = function(value) {
        var thisCtrl = ctrl;
        var pool = $scope.$eval(attr.rpUnique) || [];
        var orig = _.every(group, bind(function($scope, elm, attr, ctrl){
          return attr.rpUniqueOrig && checkValue(ctrl === thisCtrl ? value : ctrl.$viewValue, $scope.$eval(attr.rpUniqueOrig));
        }));
        if (orig) {
          // Original value is always allowed
          setResult(true);
        } else if (attr.rpUniqueField) {
          var check = function (i){
            return _.every(group, bind(function($scope, elm, attr, ctrl){
              return checkValue(pool[i][attr.rpUniqueField], ctrl === thisCtrl ? value : ctrl.$viewValue);
            }));
          };
          for (i = 0, l = pool.length; i < l; i++) {
            if (check(i)) {
              setResult(false);
              return value;
            }
            setResult(true);
          }
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
 * Field uniqueness validator scope for group mode. rpUniqueField must be present.
 *
 * @example
 *   <div rp-unique-scope>
 *     <input ng-model="name" rp-unique="addressbook" rp-unique-field="name"> // this will not join the group
 *     <input ng-model="address" rp-unique="addressbook" rp-unique-field="address" rp-unique-group="address-dt">
 *     <input ng-model="dt" rp-unique="addressbook" rp-unique-field="dt" rp-unique-group="address-dt">
 *   </div>
 */
var RP_UNIQUE_SCOPE = "rp-unique-scope";
module.directive('rpUniqueScope', function() {
  return {
    restrict: 'EA',
    link: {
      pre: function ($scope, elm) {
        elm.data(RP_UNIQUE_SCOPE, {});
      }
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
        if (password.toLowerCase() === username.toLowerCase()) {
          ctrl.$setValidity('rpStrongPassword', false);
          scope.strength = 'match';
          return;
        }

        checkRepetition = function (pLen, str) {
          var res = "";
          for (var i = 0; i < str.length; i++ ) {
            var repeated = true;

            for (var j = 0; j < pLen && (j+i+pLen) < str.length; j++) {
              repeated = repeated && (str.charAt(j+i) === str.charAt(j+i+pLen));
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

module.directive('rpAmount', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (value && value.toString().indexOf(",") != -1) {
          value = value.split(",").join("");
        }

        var test = /^(([0-9]*?\.\d+)|([0-9]\d*))$/.test(value);

        if (test && value[0] == '.') {
          value = '0' + value;
        }

        // check for valid amount
        ctrl.$setValidity('rpAmount', test);

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});

module.directive('rpAmountPositive', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      // We don't use parseAmount here, assuming that you also use rpAmount validator
      var validator = function(value) {
        // check for positive amount
        ctrl.$setValidity('rpAmountPositive', value > 0);

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});

module.directive('rpAmountXrpLimit', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      // We don't use parseAmount here, assuming that you also use rpAmount validator
      var validator = function(value) {
        var currency = Currency.from_human(attr.rpAmountCurrency.slice(0, 3)).get_iso();

        if (currency !== 'XRP') {
          ctrl.$setValidity('rpAmountXrpLimit', true);
        } else {
          ctrl.$setValidity('rpAmountXrpLimit', value <= 100000000000 && value >= 0.000001);
        }

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);
    }
  };
});

/**
 * Maximum number of digits a user can send is 16
 */
module.directive('rpMaxDigits', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      // We don't use parseAmount here, assuming that you also use rpAmount validator
      var validator = function(value) {
        var currency = Currency.from_human(attr.rpAmountCurrency.slice(0, 3)).get_iso();

        if (currency === 'XRP') {
          ctrl.$setValidity('rpMaxDigits', true);
        } else {
          var test = /^(?:(?=.{2,17}$)\d+\.\d+|\d{1,16})$/.test(value);

          // check for valid amount
          ctrl.$setValidity('rpMaxDigits', test);
        }

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpAmountCurrency', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Limit currencies to be entered
 */
module.directive('rpRestrictCurrencies', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        var match = /^([a-zA-Z0-9]{3}|[A-Fa-f0-9]{40})\b/.exec(value);

        if (attr.rpRestrictCurrencies) {
          if (match) {
            ctrl.$setValidity('rpRestrictCurrencies',
              attr.rpRestrictCurrencies.indexOf(match[1]) != -1
                ? true
                : value === 'XRP'
            );
          } else {
            ctrl.$setValidity('rpRestrictCurrencies', false);
          }
        }
        else {
          ctrl.$setValidity('rpRestrictCurrencies', true);
        }

        return value;
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
        ctrl.$setValidity('rpPortNumber', !value || (parseInt(value, 10) == value && value >= 1 && value <= 65535));
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
 * Used for currency selectors
 */
module.directive('rpNotXrp', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        ctrl.$setValidity('rpNotXrp', !value || value.toLowerCase() !== 'xrp');
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpNotXrp', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});

/**
 * Email address validation
 */
module.directive('rpEmail', function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

      var validator = function(value) {
        ctrl.$setValidity('rpEmail', emailRegex.test(value));
        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpEmail', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
