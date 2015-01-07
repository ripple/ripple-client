// TODO Make it have different styling for different limits
angular
  .module('directives', ['popup'])    
  .directive('rpInboundBridgeLimit', [function(){
  return {
    restrict: 'E',
    scope: {
      limit: '='
    },
    template: '<span> {{limit}} BTC </span>',
    compile: function(element, attrs) {
      element.addClass('test');
    }
  };
}]);
