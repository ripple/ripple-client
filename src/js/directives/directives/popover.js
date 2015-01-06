/**
 * Popovers
 */
angular
  .module('directives', ['popup'])
  .directive('rpPopover', ['$interpolate', function($interpolate) {
  return function(scope, element, attr) {
    var interpolateContent = function () {
      return $interpolate(attr.rpPopoverContent)(scope);
    };

    if (!attr.rpPopoverTrigger) attr.rpPopoverTrigger = 'click';

    var options = {
      html: true,
      placement: attr.rpPopoverPlacement,
      trigger: attr.rpPopoverTrigger
    };
    if (attr.rpPopoverTitle) {
      options.title = attr.rpPopoverTitle;
    }
    else {
      options.template = '<div class="popover"><div class="arrow"></div><div class="popover-inner"><div class="popover-content" ></div></div></div>';
    }
    if (attr.rpPopoverContent) {
      options.content = interpolateContent;
    }
    if (attr.rpPopoverDelay) {
      var delay = attr.rpPopoverDelay;
      if (typeof delay !== 'number') {
        delay = 500;
      }
      options.delay = {
        show: delay,
        hide: 0
      };
    }
    $(element).popover(options);

    $('html').click(function() {
      $(element).popover('hide');
    });

    $(element).click(function(event){
      event.stopPropagation();
    });
  };
}]);
