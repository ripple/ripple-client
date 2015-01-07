/*
 * Adds download functionality to an element.
 */
angular
  .module('directives', ['popup'])
  .directive('rpDownload', [function() {
  return {
    restrict: 'A',
    scope: {
      data: '=rpDownload',
      filename: '@rpDownloadFilename',
      isCsv: '@rpDownloadCsv',
      clickHandler: '@ngClick'
    },
    compile: function(element, attr, linker) {
      return function(scope, element, attr) {
        var trigger = element.find('[rp-download-trigger]');
        if (!trigger.length) trigger = element;

        if ("download" in document.createElement("a")) {
          scope.$watch('data', function(data) {
            if (scope.isCsv) trigger.attr('href', data ? "data:text/csv;charset=utf-8," + escape(data) : "");
            else trigger.attr('href', "data:text/plain," + data);
          });
          scope.$watch('filename', function(filename) {
            trigger.attr('download', filename);
          });
        } else if (swfobject.hasFlashPlayerVersion("10.0.0")) {
          element.css('position', 'relative');

          setImmediate(function() {
            var width = trigger.innerWidth();
            var height = trigger.innerHeight();
            var offsetTrigger = trigger.offset();
            var offsetElement = element.offset();
            var topOffset = offsetTrigger.top - offsetElement.top;
            var leftOffset = offsetTrigger.left - offsetElement.left;
            var dl = Downloadify.create(element[0], {
              filename: function() {
                return scope.filename;
              },
              data: function() {
                // If there was a click handler in the element Downloadify hides, then trigger it now
                if (scope.clickHandler) trigger.trigger('click');
                return scope.data;
              },
              transparent: true,
              swf: 'swf/downloadify.swf',
              downloadImage: 'img/transparent_l.gif',
              width: width,
              height: height,
              append: true
            });

            var id = dl.flashContainer.id;
            $('#' + id).css({
              position: 'absolute',
              top: topOffset + 'px',
              left: leftOffset + 'px'
            });
          });
        } else {
          // XXX Should provide some alternative or error
        }
      };
    }
  };
}]);
