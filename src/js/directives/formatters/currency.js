var Amount = ripple.Amount;
var Currency = ripple.Currency;

angular
  .module('formatters', ['domainalias'])
  .directive('rpCurrency', function () {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.$watch(attr.rpCurrency, function (input) {
          var currency;
          var mainText;

          if (input instanceof Currency) {
            currency = input;
          } else {
            var amount = Amount.from_json(input);
            currency = amount.currency();
          }

          //TODO: Delete once Malika pushes her changes for trading pairs
          mainText = currency.has_interest() ? currency.to_human().slice(0,3) + ' (-0.5%pa) - Gold' : currency.to_human();

          if (attr.rpCurrencyFull) {
            var currencyInfo = $.grep(scope.currencies_all, function(e){ return e.value == mainText; })[0];
            if (currencyInfo) {
              mainText = currencyInfo.value  + " - " + currencyInfo.name;
            }
          }

          if (currency.has_interest()) {
            // Get yearly interest rate
            var referenceDate = currency._interest_start + 3600 * 24 * 365;
            var interestRate = currency.get_interest_at(referenceDate);

            // Convert to percent and round to two decimal places
            interestRate = Math.round(interestRate * 10000 - 10000) / 100;

            var helpText;
            if (interestRate > 0) {
              // Positive interest
              helpText = "Interest: "+interestRate+" %/yr";
            } else {
              // Fee
              helpText = "Fee: "+(-interestRate)+"%/yr";
            }

            var el = $('<abbr></abbr>')
                  .attr('title', helpText)
                  .text(mainText);
            element.empty().append(el);
          } else {
            element.empty().text(mainText);
          }
        });
      };
    }
  };
});
