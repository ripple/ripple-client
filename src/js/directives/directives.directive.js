/**
 * DIRECTIVES
 *
 * Miscellaneous directives go in this file.
 */

var module = angular.module('directives', ['popup']);

/**
 * Inline edit
 */
module.directive('inlineEdit', function() {
  var previewTemplate = '<span ng-hide="mode">{{model}}</span>';
  var editTemplate = '<input ng-show="mode" ng-model="model" />';

  return {
    restrict: 'E',
    scope: {
      model: '=',
      mode: '='
    },
    template: previewTemplate + editTemplate
  };
});

module.directive('rpConfirm', ['rpPopup', '$parse', function(popup, $parse) {
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

module.directive('rpPopup', ['rpPopup', '$parse', function(popup, $parse) {
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
        var xml = new XMLSerializer().serializeToString(content[0]);

        popup.blank(xml, scope);
        if (attrs.onopen && scope[attrs.onopen]) {
          scope[attrs.onopen]();
        }
      });
    }
  };
}]);

// TODO Make it have different styling for different limits
module.directive('rpInboundBridgeLimit', [function() {
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

/*
 * Adds download functionality to an element.
 */
module.directive('rpDownload', [function() {
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

/**
 * Tooltips
 */
module.directive('rpTooltip', [function() {
  return function(scope, element, attr) {
    attr.$observe('rpTooltip', function(value) {
      // Title
      var options = {title: value};

      // Placement
      if (attr.rpTooltipPlacement)
        options.placement = attr.rpTooltipPlacement;

      $(element).tooltip('destroy');
      $(element).tooltip(options);
    });
  };
}]);

/**
 * Popovers
 */
module.directive('rpPopover', ['$interpolate', function($interpolate) {
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

module.directive('rpAutofill', ['$parse', function($parse) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function($scope, element, attr, ctrl) {
      if (!ctrl) return;

      $scope.$watch(attr.rpAutofill, function(value) {
        if (value) {
          // Normalize amount
          if (attr.rpAutofillAmount || attr.rpAutofillCurrency) {
            // 1 XRP will be interpreted as 1 XRP, not 1 base unit
            if (value === ("" + parseInt(value, 10))) {
              value = value + '.0';
            }

            var convertCurrency = function(currencyObj) {
              if (attr.rpAutofillCurrencyFullname) {
                if ($scope.currencies_all_keyed[currencyObj.get_iso()]) {
                  return currencyObj.to_human({full_name:$scope.currencies_all_keyed[currencyObj.get_iso()].name});
                } else {
                  return currencyObj.to_human();
                }
              } else {
                return currencyObj.to_json();
              }
            };

            // Is it an amount?
            var amount = ripple.Amount.from_json(value);
            if (amount.is_valid()) {
              if (attr.rpAutofillAmount) {
                value = amount.to_human({
                  group_sep: false
                });
              } else {
                value = convertCurrency(amount.currency());
              }
            }
            // Maybe a currency?
            else {
              var currency = ripple.Currency.from_json(value);
              if (!currency.is_valid()) return;

              value = convertCurrency(currency);
            }
          }

          element.val(value);
          ctrl.$setViewValue(value);
          $scope.$eval(attr.rpAutofillOn);
        }
      }, true);
    }
  };
}]);

module.directive('rpSelectEl', [function() {
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

module.directive('rpNoPropagate', [function() {
  return {
    restrict: 'A',
    link: function($scope, element, attr) {
      element.click(function(e) {
        e.stopPropagation();
      });
    }
  };
}]);

/**
 * Spinner
 */
module.directive('rpSpinner', [function() {
  return {
    restrict: 'A',
    require: '^form',
    link: function(scope, element, attr, ctrl) {
      var spinner = null;
      scope.$watch(ctrl.$name + '.' + element.attr('name') + '.$pending', function(pending) {
        element.removeClass('spinner');
        if (spinner) {
          spinner.stop();
          spinner = null;
        }

        if (pending) {
          spinner = new Spinner({
            lines: 9, // The number of lines to draw
            length: 3, // The length of each line
            width: 2, // The line thickness
            radius: 4, // The radius of the inner circle
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

// Version 0.2.0
// AngularJS simple file upload directive
// this directive uses an iframe as a target
// to enable the uploading of files without
// losing focus in the ng-app.
//
// <div ng-app="app">
//   <div ng-controller="mainCtrl">
//    <form action="/uploads" ng-upload="results()">
//      <input type="file" name="avatar"></input>
//      <input type="submit" value="Upload"></input>
//    </form>
//  </div>
// </div>
//
//  angular.module('app', ['ngUpload'])
//    .controller('mainCtrl', function($scope) {
//      $scope.results = function(content) {
//        console.log(content);
//      }
//  });
//
//
module.directive('ngUpload', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // Options (just 1 for now)
      // Each option should be prefixed with 'upload-Options-' or 'uploadOptions'
      // {
      //    // specify whether to enable the submit button when uploading forms
      //    enableControls: bool
      // }
      var options = {};
      options.enableControls = attrs.uploadOptionsEnableControls;

      // get scope function to execute on successful form upload
      if (attrs.ngUpload) {
        element.attr("target", "upload_iframe");
        element.attr("method", "post");

        // Append a timestamp field to the url to prevent browser caching results
        element.attr("action", element.attr("action") + "?_t=" + new Date().getTime());

        element.attr("enctype", "multipart/form-data");
        element.attr("encoding", "multipart/form-data");

        // Retrieve the callback function
        var fn = attrs.ngUpload.split('(')[0];
        var callbackFn = scope.$eval(fn);
        if (callbackFn === null || callbackFn === undefined || !angular.isFunction(callbackFn)) {
          var message = "The expression on the ngUpload directive does not point to a valid function.";
          // console.error(message);
          throw message + "\n";
        }

        // Helper function to create new iframe for each form submission
        var addNewDisposableIframe = function(submitControl) {
          // create a new iframe
          var iframe = $("<iframe id='upload_iframe' name='upload_iframe' border='0' width='0' height='0' style='width: 0px; height: 0px; border: none; display: none' />");

          // attach function to load event of the iframe
          iframe.bind('load', function() {
            // get content - requires jQuery
            var content = iframe.contents().find('body').text();

            // execute the upload response function in the active scope
            scope.$apply(function() {
              callbackFn(content, content !== "" /* upload completed */ );
            });

            // remove iframe
            if (content !== "") // Fixes a bug in Google Chrome that dispose the iframe before content is ready.
              setTimeout(function() {
                iframe.remove();
              }, 250);

            // if (options.enableControls == null || !(options.enableControls.length >= 0))
            submitControl.attr('disabled', null);
            submitControl.attr('title', 'Click to start upload.');
          });

          // add the new iframe to application
          element.parent().append(iframe);
        };

        // 1) get the upload submit control(s) on the form (submitters must be decorated with the 'ng-upload-submit' class)
        // 2) attach a handler to the controls' click event
        $('.upload-submit', element).click(

          function() {
            addNewDisposableIframe($(this) /* pass the submit control */ );

            scope.$apply(function() {
              callbackFn("Please wait...", false /* upload not completed */ );
            });

            // console.log(angular.toJson(options));

            var enabled = true;
            if (options.enableControls === null || options.enableControls === undefined || options.enableControls.length >= 0) {
              // disable the submit control on click
              $(this).attr('disabled', 'disabled');
              enabled = false;
            }

            $(this).attr('title', (enabled ? '[ENABLED]: ' : '[DISABLED]: ') + 'Uploading, please wait...');

            // submit the form
            $(element).submit();
          }).attr('title', 'Click to start upload.');
      } else console.log("No callback function found on the ngUpload directive.");
    }
  };
});

/**
 * Focus element on render
 */
module.directive('rpFocus', ['$timeout', function($timeout) {
  return function($scope, element) {
    $timeout(function() {
      $scope.$watch(function() {return element.is(':visible');}, function(newValue) {
        if (newValue === true)
          element.focus();
      });
    });
  };
}]);

module.directive('rpOffCanvasMenu', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.find('h2').click(function () {
        element.parent().toggleClass('off-canvas-nav-expand');
      });
    }
  };
});

module.directive('rpSnapper', ['rpId', function(id) {
  return function($scope) {
    // Initialize snapper only if user is logged in.
    var watcher = $scope.$watch(function(){return id.loginStatus;}, function() {
      var snapper;

      if (id.loginStatus) {
        setImmediate(function(){
          snapper = new Snap({
            element: document.getElementById('wrapper'),
            disable: 'right'
          });

          // Check
          checkSize();

          // Snapper toggle button
          $('.snapper-toggle').click(function(){
            snapper.state().state == 'closed' ? snapper.open('left') : snapper.close();
          });

          $('.mobile-nav').find('a').click(function(){
            snapper.close();
          });
        });

        // Activate if resized to mobile size
        $(window).resize(function(){
          checkSize();
        });

        var checkSize = function(){
          // screen-xs-max
          if ('object' === typeof snapper) {
            if ($(window).width() > 767) {
              snapper.close();
              snapper.disable();
            } else {
              $('.mobile-nav').show();
              snapper.enable();
            }
          }
        };

        // Remove watcher
        watcher();
      }
    });
  }
}]);

/**
 * Adds spacing around span tags.
 */
module.directive('rpSpanSpacing', [function () {
  return {
    restrict: 'EA',
    compile: function (element, attr, linker) {
      element.find('> span').before(' ').after(' ');
    }
  };
}]);

/**
 * Used on header for my Orders widget and Contacts list.
 */
module.directive('rpSortHeader', ['$timeout', '$parse', function($timeout, $parse) {
  return {
    restrict: 'A',
    compile: function (element, attr, linker) {
      return function (scope, element, attr) {
        if (!attr.rpSortHeaderField) {
          // no field specified, do nothing
          return;
        }
        var sortFieldGetter = $parse(attr.rpSortHeader);
        var sortReverse = $parse(attr.rpSortHeaderReverse);
        var fieldName = attr.rpSortHeaderField;

        function setArrowClass(sorted, isUp) {
          var i = element.find('i');
          i.toggleClass('sorted', sorted);
          i.toggleClass('fa-caret-up', isUp);
          i.toggleClass('fa-caret-down', !isUp);
        }

        function drawArrow() {
          var sfv = sortFieldGetter(scope);
          if (sfv == fieldName) {
            setArrowClass(true, !sortReverse(scope));
          }
        }
        drawArrow();

        var watcher = scope.$watch(attr.rpSortHeader, function() {
          if (sortFieldGetter(scope) != fieldName) {
            setArrowClass(false, false);
          } else {
            element.find('span').addClass('sorted');
          }
        });
        var watcher2 = scope.$watch(attr.rpSortHeaderReverse, drawArrow);

        function updateSort() {
          var sfv = sortFieldGetter(scope);
          if (sfv != fieldName) {
            sortFieldGetter.assign(scope, fieldName);
            sortReverse.assign(scope, true);
            setArrowClass(true, false);
          } else {
            var reverseNow = sortReverse(scope);
            sortReverse.assign(scope, !reverseNow);
          }
        }

        element.click(function(e) {
          scope.$apply(updateSort);
        });

        // Make sure  is destroyed and removed.
        scope.$on('$destroy', function() {
          // Remove watcher
          watcher();
          watcher2();
        });
      };
    }
  };
}]);
