/**
 * ERRORS
 *
 * Directives related to errors and error messages.
 */

var module = angular.module('errors', []);

/**
 * Trust line graph. (Similar to small box plot.)
 */
module.directive('rpTransactionStatus', function() {
  return {
    restrict: 'E',
    template: require('../../templates/directives/transactionerror.jade'),
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
