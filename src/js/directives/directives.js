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

/**
 * Group of validation errors for a form field.
 *
 * @example
 *   <input name=send_destination ng-model=recipient>
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-valid>{{recipient}} is a valid destination.</div>
 *   </div>
 */
var RP_ERRORS = 'rp-errors';
module.directive('rpErrors', [function() {
  return {
    restrict: 'EA',
    compile: function(el, attr, linker) {
      var fieldName = attr.rpErrors || attr.on,
        errs = {};

      el.data(RP_ERRORS, errs);
      return function(scope, el) {
        var formController = el.inheritedData('$formController');
        var formName = formController.$name,
          selectedTransclude,
          selectedElement,
          selectedScope;

        function updateErrorTransclude() {
          var field = formController[fieldName];

          if (!field) return;

          var $error = field && field.$error;

          if (selectedElement) {
            selectedScope.$destroy();
            selectedElement.remove();
            selectedElement = selectedScope = null;
          }

          // Pristine fields should show neither success nor failure messages
          if (field.$pristine) return;

          // Find any error messages defined for current errors
          selectedTransclude = false;
          $.each(errs, function(validator, transclude) {
            if (validator.length <= 1) return;
            if ($error && $error[validator.slice(1)]) {
              selectedTransclude = transclude;
              return false;
            }
          });

          // Show message for valid fields
          if (!selectedTransclude && errs['+'] && field.$valid) {
            selectedTransclude = errs['+'];
          }

          // Generic message for invalid fields when there is no specific msg
          if (!selectedTransclude && errs['?'] && field.$invalid) {
            selectedTransclude = errs['?'];
          }

          if (selectedTransclude) {
            scope.$eval(attr.change);
            selectedScope = scope.$new();
            selectedTransclude(selectedScope, function(errElement) {
              selectedElement = errElement;
              el.append(errElement);
            });
          }
        }

        scope.$watch(formName + '.' + fieldName + '.$error', updateErrorTransclude, true);
        scope.$watch(formName + '.' + fieldName + '.$pristine', updateErrorTransclude);
      };
    }
  };
}]);

/**
 * Error message for validator failure.
 *
 * Use this directive within a rp-errors block to show a message for a specific
 * validation failing.
 *
 * @example
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *   </div>
 */
module.directive('rpErrorOn', [function() {
  return {
    transclude: 'element',
    priority: 500,
    compile: function(element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['!' + attrs.rpErrorOn] = transclude;
    }
  };
}]);

/**
 * Message for no matched validator failures.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * invalid, but there was no error message defined for any of the failing
 * validators.
 *
 * @example
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-unknown>Invalid value.</div>
 *   </div>
 */
module.directive('rpErrorUnknown', [function() {
  return {
    transclude: 'element',
    priority: 500,
    compile: function(element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['?'] = transclude;
    }
  };
}]);

/**
 * Message for field valid.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * valid.
 */
module.directive('rpErrorValid', [function() {
  return {
    transclude: 'element',
    priority: 500,
    compile: function(element, attrs, transclude) {
      var errs = element.inheritedData(RP_ERRORS);
      if (!errs) return;
      errs['+'] = transclude;
    }
  };
}]);

module.directive('rpConfirm', ['rpPopup', function(popup) {
  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      // Could have custom or bootstrap modal options here
      var popupOptions = {};
      element.find('a,button').click(function(e) {
        e.preventDefault();

        popup.confirm(attrs["title"], attrs["actionText"],
          attrs["actionButtonText"], attrs["actionFunction"], attrs["actionButtonCss"],
          attrs["cancelButtonText"], attrs["cancelFunction"], attrs["cancelButtonCss"],
          scope, popupOptions);
      });
    }
  };
}]);

module.directive('rpPopup', ['rpPopup', function(popup) {
  return {
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      element.find('a[rp-popup-link]').click(function(e) {
        e.preventDefault();

        popup.blank(
          new XMLSerializer().serializeToString(element.find('[rp-popup-content]')[0]),
          scope
        );
      });
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
      filename: '@rpDownloadFilename'
    },
    compile: function(element, attr, linker) {
      return function(scope, element, attr) {
        var trigger = element.find('[rp-download-trigger]');
        if (!trigger.length) trigger = element;

        if ("download" in document.createElement("a")) {
          scope.$watch('data', function(data) {
            trigger.attr('href', "data:text/plain," + data);
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
      var options = {'title': value};

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
module.directive('rpPopover', [function() {
  return function(scope, element, attr) {
    if (!attr.rpPopoverTrigger) attr.rpPopoverTrigger = 'click';

    $(element).popover({
      html: true,
      placement: attr.rpPopoverPlacement,
      title: attr.rpPopoverTitle,
      trigger: attr.rpPopoverTrigger
      // TODO also use rpPopoverContent attribute (there's a bug with this)
    });

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

            var amount = ripple.Amount.from_json(value);
            if (!amount.is_valid()) return;
            if (attr.rpAutofillAmount) {
              value = +amount.to_human({
                group_sep: false
              });
            } else {
              value = amount.currency().to_json();
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
    link: function(scope, element, attr) {
      var spinner = null;
      attr.$observe('rpSpinner', function(value) {
        element.removeClass('spinner');
        if (spinner) {
          spinner.stop();
          spinner = null;
        }

        if (value > 0) {
          element.addClass('spinner');
          spinner = new Spinner({
            lines: 9, // The number of lines to draw
            length: 3, // The length of each line
            width: 2, // The line thickness
            radius: value, // The radius of the inner circle
            className: 'spinnerInner'
          }).spin(element[0]);
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
      options.enableControls = attrs['uploadOptionsEnableControls'];

      // get scope function to execute on successful form upload
      if (attrs['ngUpload']) {

        element.attr("target", "upload_iframe");
        element.attr("method", "post");

        // Append a timestamp field to the url to prevent browser caching results
        element.attr("action", element.attr("action") + "?_t=" + new Date().getTime());

        element.attr("enctype", "multipart/form-data");
        element.attr("encoding", "multipart/form-data");

        // Retrieve the callback function
        var fn = attrs['ngUpload'].split('(')[0];
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

            //if (options.enableControls == null || !(options.enableControls.length >= 0))
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

          //console.log(angular.toJson(options));

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
    $timeout(function(){
      $scope.$watch(function () {return element.is(':visible')}, function(newValue) {
        if (newValue === true)
          element.focus();
      })
    })
  }
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

module.directive('rpSnapper', ['rpId', function($id) {
  return function($scope) {
    // Initialize snapper only if user is logged in.
    var watcher = $scope.$watch(function(){return $id.loginStatus}, function(){
      var snapper;

      if ($id.loginStatus) {
        setImmediate(function(){
          snapper = new Snap({
            element: document.getElementById('wrapper'),
            disable: 'right'
          });

          // Check
          checkSize();

          // Snapper toggle button
          $('.snapper-toggle').click(function(){
            snapper.state().state == 'closed' ? snapper.open('left') : snapper.close()
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
          // screen-sm-max
          if ('object' === typeof snapper) {
            if ($(window).width() > 991) {
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
