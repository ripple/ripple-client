/**
 * FORMATTERS
 *
 * Formatters are directives that simply display a value. Normally we do this
 * via filters, however if the value needs HTML (rather than just text) it's
 * better to use a directive.
 */

var webutil = require('../util/web'),
    Amount = ripple.Amount,
    Currency = ripple.Currency;

var module = angular.module('formatters', ['domainalias']);

module.directive('rpPrettyIssuer', ['rpDomainAlias',
                                    function (aliasService) {
  return {
    restrict: 'EA',
    scope: {
      issuer: '=rpPrettyIssuer',
      contacts: '=rpPrettyIssuerContacts'
    },
    template: '{{alias || name || issuer}}',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        function update() {
          if (!scope.issuer) {
            scope.alias = attr.rpPrettyIssuerDefault ? attr.rpPrettyIssuerDefault : '???';
            return;
          }
          var aliasPromise = aliasService.getAliasForAddress(scope.issuer);
          scope.alias = null;
          aliasPromise.then(function (result) {
            scope.alias = result;
          });

          scope.name = null;
          if (scope.contacts) {
            scope.name = webutil.isContact(scope.contacts, scope.issuer);
          }

          if (!scope.name && attr.rpPrettyIssuerOrShort) {
            scope.name = "" + scope.issuer.substring(0,7) + "…";
          }
        }

        scope.$watch('issuer', update);
        scope.$watch('contacts', update, true);
        update();
      };
    }
  };
}]);

var RP_PRETTY_AMOUNT_DATE = 'rp-pretty-amount-date';

module.directive('rpPrettyAmount', [function () {
  return {
    restrict: 'EA',
    scope: {
      amount: '=rpPrettyAmount'
    },
    template: '<span class="value">{{amount | rpamount:{reference_date:date} }}</span> ' +
              '<span class="currency" rp-currency="amount"></span>',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.date = scope.date || element.inheritedData(RP_PRETTY_AMOUNT_DATE);
      };
    }
  };
}]);

/**
 * Set the reference date for rpPrettyAmount.
 *
 * You can set this on the same element that uses rpPrettyAmount or on any
 * parent element.
 *
 * The reference date is used to calculate demurrage/interest correctly.
 */
module.directive('rpPrettyAmountDate', [function () {
  return {
    restrict: 'EA',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        element.data(RP_PRETTY_AMOUNT_DATE, scope.$eval(attr.rpPrettyAmountDate));
      };
    }
  };
}]);

module.directive('rpPrettyIdentity', ['$timeout', function ($timeout) {
  var popupDelay = 800;
  var hideDelay = 1500;

  return {
    restrict: 'EA',
    scope: {
      identity: '=rpPrettyIdentity'
    },
    template: '{{identity | rpcontactname | rpripplename:{tilde:true} }}',
    compile: function (element, attr, linker) {
      if (attr.rpPrettyIdentityFilters) {
        element.text('{{identity | ' + attr.rpPrettyIdentityFilters + ' }}');
      }
      return function (scope, element, attr) {
        var cancelHidePopoverTimeout;
        var cancelShowPopoverTimeout;
        var tip;
        var shown = false;

        function hidePopover() {
          if (!cancelHidePopoverTimeout) {
            cancelHidePopoverTimeout = $timeout( function() {
              element.popover('hide');
              shown = false;
            }, hideDelay, false );
            cancelHidePopoverTimeout.finally(function() { cancelHidePopoverTimeout = null; });
          }
        }

        function onPopoverEnter() {
          if (cancelShowPopoverTimeout) {
            $timeout.cancel( cancelShowPopoverTimeout );
            cancelShowPopoverTimeout = null;
          }
          if (cancelHidePopoverTimeout) {
            $timeout.cancel( cancelHidePopoverTimeout );
            cancelHidePopoverTimeout = null;
          }
        }

        function onPopoverLeave() {
          hidePopover();
        }

        function onElemEnter() {
          if (cancelHidePopoverTimeout) {
            $timeout.cancel( cancelHidePopoverTimeout );
            cancelHidePopoverTimeout = null;
          } else if (!cancelShowPopoverTimeout) {
            cancelShowPopoverTimeout = $timeout( function() {
              element.popover('show'); 
              shown = true;
            }, popupDelay, false );
            cancelShowPopoverTimeout.finally(function() { cancelShowPopoverTimeout = null; });
          }
        }

        function onElemLeave() {
          if (cancelShowPopoverTimeout) {
            $timeout.cancel( cancelShowPopoverTimeout );
            cancelShowPopoverTimeout = null;
          } else if (shown) {
            hidePopover();
          }
        }

        function unbindHanlders() {
          element.unbind('mouseenter', onElemEnter);
          element.unbind('mouseleave', onElemLeave);
          tip.unbind('mouseenter', onPopoverEnter);
          tip.bind('mouseleave', onPopoverLeave);
        }
        // XXX Set title to identity
        console.log(element);

        element.popover('destroy');
        var content = 'Ripple address ' + scope.identity;
        var options = {  content: content,
          trigger: 'manual', placement: 'top',
          container: 'body',
          template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><div class="popover-content" ></div></div></div>'
        };
        var popover = element.popover(options);
        tip = element.data('popover').tip();
        element.bind('mouseenter', onElemEnter);
        element.bind('mouseleave', onElemLeave);
        tip.bind('mouseenter', onPopoverEnter);
        tip.bind('mouseleave', onPopoverLeave);
        // Make sure popover is destroyed and removed.
        scope.$on('$destroy', function onDestroyPopover() {
          $timeout.cancel( cancelHidePopoverTimeout );
          $timeout.cancel( cancelShowPopoverTimeout );
          unbindHanlders();
          if (tip) {
            tip.remove();
            tip = null;
          }
        });
      };
    }
  };
}]);

module.directive('rpBindColorAmount', function () {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.$watch(attr.rpBindColorAmount, function(value){
          if (value) {
            var parts = value.split(".");

            if (parts.length === 2) { // you never know
              var decimalPart = parts[1].replace(/0(0+)$/, '0<span class="insig">$1</span>');

              element[0].innerHTML = decimalPart.length > 0 ? parts[0] + "." + decimalPart : parts[0];
            }
          }
        });
      };
    }
  };
});

module.directive('rpCurrency', function () {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        scope.$watch(attr.rpCurrency, function (input) {
          var currency;
          if (input instanceof Currency) {
            currency = input;
          } else {
            var amount = Amount.from_json(input);
            currency = amount.currency();
          }

          var mainText = currency.to_human();

          // Should we look for a full name like "USD - US Dollar"?
          if (attr.rpCurrencyFull) {
            var currencyInfo = $.grep(scope.currencies_all, function(e){ return e.value == mainText; })[0];
            if (currencyInfo) mainText = currencyInfo.name;
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
