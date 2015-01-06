angular
  .module('directives', ['popup'])
  .directive('rpAutofill', ['$parse', function($parse) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function($scope, element, attr, ctrl) {
      if (!ctrl) return;

      $scope.$watch(attr.rpAutofill, function(value) {
        if (value) {
          // Normalize amount
          if (attr.rpAutofillAmount || attr.rpAutofillCurrency) {
            // 1 XRP will be interpreted as 1 XRP, not 1 base unit
            if (value === ("" + parseInt(value, 10))) {
              value = value + '.0';
            }

            var convertCurrency = function(currencyObj) {
              if (attr.rpAutofillCurrencyFullname) {
                if ($scope.currencies_all_keyed[currencyObj.get_iso()]) {
                  return currencyObj.to_human({full_name:$scope.currencies_all_keyed[currencyObj.get_iso()].name});
                } else {
                  return currencyObj.to_human();
                }
              } else {
                return currencyObj.to_json();
              }
            };

            // Is it an amount?
            var amount = ripple.Amount.from_json(value);
            if (amount.is_valid()) {
              if (attr.rpAutofillAmount) {
                value = amount.to_human({
                  group_sep: false
                });
              } else {
                value = convertCurrency(amount.currency());
              }
            }
            // Maybe a currency?
            else {
              var currency = ripple.Currency.from_json(value);
              if (!currency.is_valid()) return;

              value = convertCurrency(currency);
            }
          }

          element.val(value);
          ctrl.$setViewValue(value);
          $scope.$eval(attr.rpAutofillOn);
        }
      }, true);
    }
  };
}]);
