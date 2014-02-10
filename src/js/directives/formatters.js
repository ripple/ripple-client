/**
 * FORMATTERS
 *
 * Formatters are directives that simply display a value. Normally we do this
 * via filters, however if the value needs HTML (rather than just text) it's
 * better to use a directive.
 */

var webutil = require('../util/web');

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
              '<span class="currency">{{amount | rpcurrency}}</span>',
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

module.directive('rpPrettyIdentity', [function () {
  return {
    restrict: 'EA',
    scope: {
      identity: '=rpPrettyIdentity'
    },
    template: '{{identity | rpcontactname}}',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        // XXX Set title to identity
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
            var decimalPart = parts[1].replace(/0(0+)$/, '0<span class="insig">$1</span>');

            element[0].innerHTML = decimalPart.length > 0 ? parts[0] + "." + decimalPart : parts[0];
          }
        });
      };
    }
  };
});
