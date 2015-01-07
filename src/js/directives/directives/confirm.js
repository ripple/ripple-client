angular
  .module('directives', ['popup'])    
  .directive('rpConfirm', ['rpPopup', '$parse', function(popup, $parse) {
  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      // Could have custom or bootstrap modal options here
      var popupOptions = {};

      element.find('a,button').click(function(e) {
        e.preventDefault();

        // show is an optional function that returns boolean:
        // if specified, invoke it and use return value to decide whether to show popup
        // if not specified, always show popup
        var show = attrs.rpShow ? $parse(attrs.rpShow)(scope) : true;
        if (show) {
          popup.confirm(attrs.title, attrs.actionText,
            attrs.actionButtonText, attrs.actionFunction, attrs.actionButtonCss,
            attrs.cancelButtonText, attrs.cancelFunction, attrs.cancelButtonCss,
            scope, popupOptions);
        }
      });
    }
  };
}]);
