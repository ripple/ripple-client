angular
  .module('formatters', ['domainalias'])
  .directive('rpPrettyIdentity', [function () {
  return {
    restrict: 'EA',
    scope: {
      identity: '=rpPrettyIdentity'
    },
    template: '{{identity | rpcontactnamefull | rpripplename:{tilde:true} }}',
    compile: function (element, attr, linker) {
      if (attr.rpPrettyIdentityFilters) {
        element.text('{{identity | ' + attr.rpPrettyIdentityFilters + ' }}');
      }
      return function (scope, element, attr) {
        // XXX Set title to identity
      };
    }
  };
}]);
