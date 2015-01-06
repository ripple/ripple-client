var webutil = require('../../util/web');
var Base = ripple.Base;
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
angular
  .module('validators', [])
  .directive('rpDest', ['$timeout', '$parse', 'rpFederation', function ($timeout, $parse, $federation) {
  var emailRegex = /^\S+@\S+\.[^\s.]+$/;
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;
      
      function showLoading(doShow) {
        if (attr.rpDestLoading) {
          var getterL = $parse(attr.rpDestLoading);
          getterL.assign(scope,doShow);
        }
      }

      var timeoutPromise, getter;
      var validator = function(value) {
        var strippedValue = webutil.stripRippleAddress(value);
        var address = ripple.UInt160.from_json(strippedValue);

        ctrl.rpDestType = null;
        if (attr.rpDestFederationModel) {
          getter = $parse(attr.rpDestFederationModel);
          getter.assign(scope,null);
        }

        if (attr.rpDestAddress && address.is_valid()) {
          ctrl.rpDestType = "address";
          ctrl.$setValidity('rpDest', true);

          if (attr.rpDestModel) {
            getter = $parse(attr.rpDestModel);
            getter.assign(scope,value);
          }

          return value;
        }

        if (attr.rpDestContact && scope.userBlob &&
          webutil.getContact(scope.userBlob.data.contacts,strippedValue)) {
          ctrl.rpDestType = "contact";
          ctrl.$setValidity('rpDest', true);

          if (attr.rpDestModel) {
            getter = $parse(attr.rpDestModel);
            getter.assign(scope,webutil.getContact(scope.userBlob.data.contacts,strippedValue).address);
          }

          return value;
        }

        if (attr.rpDestBitcoin && !isNaN(Base.decode_check([0, 5], strippedValue, 'bitcoin'))) {
          ctrl.rpDestType = "bitcoin";
          ctrl.$setValidity('rpDest', true);

          if (attr.rpDestModel) {
            getter = $parse(attr.rpDestModel);
            getter.assign(scope,value);
          }

          return value;
        }

        if (attr.rpDestEmail && emailRegex.test(strippedValue)) {
          ctrl.rpDestType = "email";
          if (attr.rpDestCheckFederation) {
            ctrl.$setValidity('rpDest', false);
            showLoading(true);

            $federation.check_email(value)
              .then(function (result) {
                // Check if this request is still current, exit if not
                if (value != ctrl.$viewValue) return;
                showLoading(false);
                ctrl.$setValidity('rpDest', true);

                // Check if this request is still current, exit if not
                // var now_recipient = send.recipient_address;
                // if (recipient !== now_recipient) return;
                // ctrl.$viewValue
                if (attr.rpDestModel) {
                  getter = $parse(attr.rpDestModel);
                  getter.assign(scope,value);
                }
                if (attr.rpDestFederationModel) {
                  getter = $parse(attr.rpDestFederationModel);
                  getter.assign(scope,result);
                }
              }, function () {
                // Check if this request is still current, exit if not
                if (value != ctrl.$viewValue) return;
                showLoading(false);
              });
          } else {
            ctrl.$setValidity('rpDest', true);

            if (attr.rpDestModel) {
              getter = $parse(attr.rpDestModel);
              getter.assign(scope,value);
            }
          }
          return value;
        }

        if (((attr.rpDestRippleName && webutil.isRippleName(value)) ||
          (attr.rpDestRippleNameNoTilde && value && value[0] !== '~' && webutil.isRippleName('~'+value)))) { // TODO Don't do a client check in validators
          ctrl.rpDestType = "rippleName";

          if (timeoutPromise) $timeout.cancel(timeoutPromise);

          timeoutPromise = $timeout(function(){
            showLoading(true);

            ripple.AuthInfo.get(Options.domain, value, function(err, info){
              scope.$apply(function(){
                ctrl.$setValidity('rpDest', info.exists);

                if (attr.rpDestModel && info.exists) {
                  getter = $parse(attr.rpDestModel);
                  getter.assign(scope,info.address);
                }

                showLoading(false);
              });
            });
          }, 500);

          return value;
        }

        ctrl.$setValidity('rpDest', false);
        return;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpDest', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
}]);
