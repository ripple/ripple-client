/**
 * ERRORS
 *
 * Directives related to errors and error messages.
 */

var module = angular.module('errors', []);

module.directive('rpTransactionStatus', function() {
  return {
    restrict: 'E',
    templateUrl: 'templates/' + lang + '/directives/transactionerror.html',
    scope: {
      engine_result: '@rpEngineResult',
      engine_result_message: '@rpEngineResultMessage',
      accepted: '@rpAccepted',
      tab: '@rpCurrentTab'
    },
    link: function(scope, elm, attrs) {
    }
  };
});
