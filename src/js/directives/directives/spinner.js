/**
 * Spinner
 */
angular
  .module('directives', ['popup'])
  .directive('rpSpinner', [function() {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      var spinner = null;
      attr.$observe('rpSpinner', function(value) {
        element.removeClass('spinner');
        if (spinner) {
          spinner.stop();
          spinner = null;
        }

        if (value > 0) {
          spinner = new Spinner({
            lines: 9, // The number of lines to draw
            length: 3, // The length of each line
            width: 2, // The line thickness
            radius: value, // The radius of the inner circle
            className: 'spinnerInner'
          });

          // Spinner for input field
          if (element.is('input')) {
            element.after('<div class="inputSpinner"></div>');
            spinner.spin(element.parent().find('.inputSpinner')[0]);
          }

          // Spinner for everything else
          else {
            element.addClass('spinner');
            spinner.spin(element[0]);
          }
        }
      });
    }
  };
}]);
