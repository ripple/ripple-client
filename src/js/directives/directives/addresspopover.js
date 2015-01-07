/**
 * Special popover to show ripple address with ability to double click on address to select.
 * Also can link to www.ripplecharts.com.
 */
angular
  .module('directives', ['popup'])
  .directive('rpAddressPopover', ['$timeout', '$interpolate', 'rpId', function($timeout, $interpolate, $id) {
  var popupDelay = 800;
  var hideDelay =  700;

  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        var cancelHidePopoverTimeout;
        var cancelShowPopoverTimeout;
        var tip;
        var shown = false;
        var identity = $interpolate('{{' + attr.rpAddressPopover + '}}')(scope);

        function hidePopover() {
          if (!cancelHidePopoverTimeout) {
            cancelHidePopoverTimeout = $timeout(function() {
              element.popover('hide');
              shown = false;
            }, hideDelay, false);
            cancelHidePopoverTimeout['finally'](function() { cancelHidePopoverTimeout = null; });
          }
        }

        function onPopoverEnter() {
          if (cancelShowPopoverTimeout) {
            $timeout.cancel(cancelShowPopoverTimeout);
            cancelShowPopoverTimeout = null;
          }
          if (cancelHidePopoverTimeout) {
            $timeout.cancel(cancelHidePopoverTimeout);
            cancelHidePopoverTimeout = null;
          }
        }

        function onPopoverLeave() {
          hidePopover();
        }

        function onElemEnter() {
          if (cancelHidePopoverTimeout) {
            $timeout.cancel(cancelHidePopoverTimeout);
            cancelHidePopoverTimeout = null;
          } else if (!cancelShowPopoverTimeout) {
            cancelShowPopoverTimeout = $timeout(function() {
              element.popover('show');
              shown = true;
            }, popupDelay, false);
            cancelShowPopoverTimeout['finally'](function() { cancelShowPopoverTimeout = null; });
          }
        }

        function onElemLeave() {
          if (cancelShowPopoverTimeout) {
            $timeout.cancel(cancelShowPopoverTimeout);
            cancelShowPopoverTimeout = null;
          } else if (shown) {
            hidePopover();
          }
        }

        function unbindHanlders() {
          element.unbind('mouseenter', onElemEnter);
          element.unbind('mouseleave', onElemLeave);
          tip.unbind('mouseenter', onPopoverEnter);
          tip.bind('mouseleave', onPopoverLeave);
        }
        // XXX Set title to identity

        element.popover('destroy');
        var content = 'Ripple address ' + identity;
        var options = {
          content: content,
          trigger: 'manual', placement: 'top',
          container: 'body',
          template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><div class="popover-content"></div></div></div>'
        };
        if (attr.rpAddressPopoverLinkToCharts) {
          options.html = true;
          options.content = identity + '<br/><a target="_blank" href="http://www.ripplecharts.com/#/graph/' + identity + '" >Show in graph</a>';
        }
        var popover = element.popover(options);
        tip = element.data('popover').tip();
        element.bind('mouseenter', onElemEnter);
        element.bind('mouseleave', onElemLeave);
        tip.bind('mouseenter', onPopoverEnter);
        tip.bind('mouseleave', onPopoverLeave);

        if (attr.rpAddressPopoverLinkToCharts) {
          $id.resolveName(identity, { tilde: true }).then(function(name) {
            if (name != identity && tip) {
              element.data('popover').options.content = name + '<br/>' + identity +
                  '<br/><a target="_blank" href="http://www.ripplecharts.com/#/graph/' + identity + '" >Show in graph</a>';
              element.data('popover').setContent();
            }
          });
        }
        // Make sure popover is destroyed and removed.
        scope.$on('$destroy', function onDestroyPopover() {
          $timeout.cancel(cancelHidePopoverTimeout);
          $timeout.cancel(cancelShowPopoverTimeout);
          unbindHanlders();
          if (tip) {
            tip.remove();
            tip = null;
          }
        });
      };
    }
  };
}]);
