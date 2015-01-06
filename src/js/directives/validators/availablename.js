/**
 * Check if the ripple name is valid and is available for use
 */
angular
  .module('validators', [])
 .directive('rpAvailableName', function ($timeout, $parse) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var timeoutPromise;

      var validator = function(value) {
        var getterInvalidReason = $parse(attr.rpAvailableNameInvalidReason);
        var getterReserved = $parse(attr.rpAvailableNameReservedFor);

        if (timeoutPromise) $timeout.cancel(timeoutPromise);

        if (!value) {
          // No name entered, show nothing, do nothing
          getterInvalidReason.assign(scope,false);
        } else if (value.length < 2) {
          getterInvalidReason.assign(scope,'tooshort');
        } else if (value.length > 20) {
          getterInvalidReason.assign(scope,'toolong');
        } else if (!/^[a-zA-Z0-9\-]+$/.exec(value)) {
          getterInvalidReason.assign(scope,'charset');
        } else if (/^-/.exec(value)) {
          getterInvalidReason.assign(scope,'starthyphen');
        } else if (/-$/.exec(value)) {
          getterInvalidReason.assign(scope,'endhyphen');
        } else if (/--/.exec(value)) {
          getterInvalidReason.assign(scope,'multhyphen');
        } else {

          timeoutPromise = $timeout(function(){
            if (attr.rpLoading) {
              var getterL = $parse(attr.rpLoading);
              getterL.assign(scope,true);
            }

            ripple.AuthInfo.get(Options.domain, value, function(err, info){
              scope.$apply(function(){
                if (info.exists) {
                  ctrl.$setValidity('rpAvailableName', false);
                  getterInvalidReason.assign(scope,'exists');
                } else if (info.reserved) {
                  ctrl.$setValidity('rpAvailableName', false);
                  getterInvalidReason.assign(scope,'reserved');
                  getterReserved.assign(scope,info.reserved);
                } else {
                  ctrl.$setValidity('rpAvailableName', true);
                }

                if (attr.rpLoading) {
                  getterL.assign(scope,false);
                }
              });
            });
          }, 500);

          return value;
        }

        ctrl.$setValidity('rpAvailableName', false);
        return;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpAvailableName', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
