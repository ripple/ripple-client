/**
 * Datepicker
 */
angular
  .module('fields', [])
  .directive('rpDatepicker', [function() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, element, attr, ngModel) {
      attr.$observe('rpDatepicker', function() {
        var dp = $(element).datepicker();
        dp.on('changeDate', function(e) {
          scope.$apply(function () {
            ngModel.$setViewValue(e.date.getMonth() ? e.date : new Date(e.date));
          });
        });
        scope.$watch(attr.ngModel,function() {
          var update = ngModel.$viewValue;

          function falsy(v) {return v == '0' || v == 'false'; }

          if (!falsy(attr.ignoreInvalidUpdate) &&
               (update == null ||
                 (update instanceof Date && isNaN(update.getYear())) )) {
              return;
            } else {
              dp.datepicker('setValue', update)
                .datepicker('update');
            }
        });
      });
    }
  };
}]);
