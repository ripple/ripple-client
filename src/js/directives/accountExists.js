
(function(angular, ripple) {
'use strict';

var webutil = require('../util/web');

/**
 * Validate a trust destination.
 *
 * - rp-account-exists-model        - If set, loads data to check from here.
 *
 * Checks with rippled network if account exists. 
 * According to rippled unfunded accounts do not exist.
 */
angular.module('validators').directive('rpAccountExists', rpAccountExists);

rpAccountExists.$inject = ['$timeout', '$parse', 'rpNetwork'];

function rpAccountExists($timeout, $parse, $network) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var rpAccountExistsModelGetter;

      function showLoading(doShow) {
        if (attr.rpAccountExistsLoading) {
          var getterL = $parse(attr.rpAccountExistsLoading);
          getterL.assign(scope,doShow);
        }
      }

      var validator = function(value) {
        var valToCheck = rpAccountExistsModelGetter ? rpAccountExistsModelGetter(scope) : value;

        var strippedValue = webutil.stripRippleAddress(valToCheck);
        var address = ripple.UInt160.from_json(strippedValue);

        function checkCurrentValue() {
          var currentValue = (rpAccountExistsModelGetter) ? rpAccountExistsModelGetter(scope) : ctrl.$viewValue;
          var currentAddress = ripple.UInt160.from_json(webutil.stripRippleAddress(currentValue));
          if (strippedValue != currentValue && !currentAddress.is_valid()) {
            scope.$apply(function() {
              ctrl.$setValidity('rpAccountExists', true);
              showLoading(false);
            });
          }
          return strippedValue != currentValue;
        }

        if (address.is_valid()) {
          ctrl.$setValidity('rpAccountExists', false);
          showLoading(true);


          $network.remote.requestAccountInfo({account: strippedValue})
            .on('success', function(m) {
              if (checkCurrentValue()) {
                return;
              }
              scope.$apply(function() {
                ctrl.$setValidity('rpAccountExists', true);
                showLoading(false);
              });
            })
            .on('error', function(m) {
              if (checkCurrentValue()) {
                return;
              }
              scope.$apply(function() {
                showLoading(false);
                if (m && m.remote && m.remote.error_code === 15) {
                  ctrl.$setValidity('rpAccountExists', false);
                } else {
                  console.log('There was an error', m);
                  ctrl.$setValidity('rpAccountExists', true);
                }
              });
            })
            .request();
          return value;
        }
        
        ctrl.$setValidity('rpAccountExists', true);
        return value;
      };

      if (attr.rpAccountExistsModel) {
        rpAccountExistsModelGetter = $parse(attr.rpAccountExistsModel);
        var watcher = scope.$watch(attr.rpAccountExistsModel, function() {
          var address = rpAccountExistsModelGetter(scope);
          validator(address);
        });

        scope.$on('$destroy', function() {
            // Remove watcher
            watcher();
        });
      }

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpAccountExists', function() {
        validator(ctrl.$viewValue);
      });

    }
  };
}

})(window.angular, window.ripple);
