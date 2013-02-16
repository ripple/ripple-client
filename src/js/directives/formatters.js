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
            scope.alias = '???';
            return;
          }
          scope.alias = aliasService.getAliasForAddress(scope.issuer);

          if (scope.contacts) {
            scope.name = webutil.unresolveContact(scope.contacts, scope.issuer);
          }
        }

        scope.$watch('issuer', update);
        scope.$watch('contacts', update, true);
        update();
      };
    }
  };
}]);
