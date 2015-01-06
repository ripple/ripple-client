angular
  .module('directives', ['popup'])    
  .directive('rpPopup', ['rpPopup', '$parse', function(popup, $parse) {
  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      var a = element.find('a[rp-popup-link]');
      a.click(function(e) {
        e.preventDefault();

        // onShow action
        if (attrs.rpPopupOnOpen) {
          $parse(attrs.rpPopupOnOpen)(scope);
        }

        var content = element.find('[rp-popup-content]');
        xml = new XMLSerializer().serializeToString(content[0]);

        popup.blank(xml, scope);
        if (attrs.onopen && scope[attrs.onopen]) {
          scope[attrs.onopen]();
        }
      });
    }
  };
}]);
