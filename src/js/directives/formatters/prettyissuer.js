var webutil = require('../../util/web');

angular
  .module('formatters', ['domainalias'])
  .directive('rpPrettyIssuer', ['rpDomainAlias',
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
            scope.name = "" + scope.issuer.substring(0, 7) + "…";
          }
        }

        scope.$watch('issuer', update);
        scope.$watch('contacts', update, true);
        update();
      };
    }
  };
}]);
