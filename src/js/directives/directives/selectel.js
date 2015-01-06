angular
  .module('directives', ['popup'])
  .directive('rpSelectEl', [function() {
  return {
    restrict: 'A',
    scope: {
      target: '@rpSelectEl'
    },
    link: function($scope, element, attr) {
      element.click(function() {
        var doc = document;
        var text = doc.getElementById($scope.target);

        if (doc.body.createTextRange) { // ms
          var range = doc.body.createTextRange();
          range.moveToElementText(text);
          range.select();
        } else if (window.getSelection) { // moz, opera, webkit
          var selection = window.getSelection();
          var srange = doc.createRange();
          srange.selectNodeContents(text);
          selection.removeAllRanges();
          selection.addRange(srange);
        }
      });
    }
  };
}]);
