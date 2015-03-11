/**
 * FIELDS
 *
 * Angular-powered input components go into this file.
 */

var webutil = require('../util/web');

var module = angular.module('fields', []);

/**
 * Combobox input element.
 *
 * Adds a autocomplete-like dropdown to an input element.
 *
 * @param {string} rpCombobox Pass a function that takes a string and returns
 *   the matching autocompletions.
 */
module.directive('rpCombobox', [function () {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, el, attrs, ngModel) {
      var keyCursor = -1;

      el.wrap('<div class="rp-combobox">');
      el.attr('autocomplete', 'off');
      var cplEl = $('<ul class="completions"></ul>').hide();
      el.parent().append(cplEl);
      if (attrs.rpComboboxSmall) {
        el.parent().addClass("rp-combobox-small");
      }

      // Explicit select button
      if (attrs.rpComboboxSelect) {
        var selectEl = $('<div>').appendTo(el.parent());
        selectEl.addClass('select');
        selectEl.mousedown(function (e) {
          e.preventDefault();
        });
        selectEl.click(function () {
          var complFn = scope.$eval(attrs.rpCombobox);
          if ("function" !== typeof complFn) {
            var options = complFn;
            complFn = webutil.queryFromOptions(complFn);
            scope.$watch(options, function(value) {
              setCompletions(complFn());
            });
          }
          setCompletions(complFn());
          if (cplEl.is(':visible')) {
            el.blur();
          } else {
            setCompletions(complFn());
            el.focus();
          }
        });
      }

      // Listen for keyboard keydown events
      el.keydown(function (e) {
        // "Up/Down" key press
        if (e.which === 38 || e.which === 40) {
          if (!cplEl.children().length) {
            updateCompletions();
          }
          e.preventDefault();

          // Move cursor (highlighted option) up/down
          if (e.which === 38) keyCursor--;
          else keyCursor++;

          updateKeyCursor();
        }

        // "Enter" key press (select the option)
        else if (e.which === 13) {
          var curEl = cplEl.find('li.cursor');
          if (cplEl.is(':visible')) {
            e.preventDefault();

            if (cplEl.find('li').length === 1) {
              // Only one completion, we'll assume that's the one they want
              selectCompletion(cplEl.find('li'));
            } else if (curEl.length === 1) {
              selectCompletion(curEl);
            }
          }
        }

        // "ESC" key press
        else if (e.which === 27) {
          // Hide the options list
          setVisible(false);
        }
      });

      // Listen for keyboard keyup events to enable binding
      el.keyup(function(e) {
        // Ignore Left, up, right, down
        if (e.which >= 37 && e.which <= 40) return;
        // Ignore Enter, Esc
        if (e.which === 13 || e.which === 27) return;

        // Any other keypress should update completions list
        updateCompletions();
      });

      el.focus(function() {
        keyCursor = -1;
        triggerCompletions();
      });

      el.blur(function() {
        setVisible(false);
      });

      cplEl.mousedown(function (e) {
        e.preventDefault();
      });

      function setVisible(to) {
        el.parent()[to ? 'addClass' : 'removeClass']('active');
        cplEl[to ? 'fadeIn' : 'fadeOut']('fast');
      }

      /**
       * Update completions list
       */
      function updateCompletions() {
        var match = ngModel.$viewValue, // Input value
            completions = [], re = null,
            complFn, valueOption;

        // Query function. This should return the full options list
        complFn = scope.$eval(attrs.rpCombobox);

        // Uses the default query function, if it's not defined
        if ("function" !== typeof complFn) {
          complFn = webutil.queryFromOptions(complFn);
        }

        if ("string" === typeof match && match.length) {
          // Escape field value
          var escaped = webutil.escapeRegExp(match);
          // Build the regex for completion list lookup
          re = new RegExp('(' + escaped + ')', 'i');

          completions = complFn(match, re);
        }

        // Value as option
        if (attrs.rpComboboxValueAsOption && match && match.length) {
          var prefix = attrs.rpComboboxValueAsOptionPrefix;

          valueOption = (prefix && 0 !== match.indexOf(prefix))
            ? prefix + match
            : match;

          completions.push(valueOption);
        }

        // Value as ripple name
        if (attrs.rpComboboxValueAsRippleName && match && match.length) { // TODO Don't do a client check in validators
          valueOption = (0 !== match.indexOf('~'))
            ? '~' + match
            : match;

          if (webutil.isRippleName(valueOption)) {
            completions.push(valueOption);
          }
        }

        // By fading out without updating the completions we get a smoother effect
        if (!completions.length) {
          setVisible(false);
          return;
        }

        setCompletions(completions, re);
        triggerCompletions();
      }

      function setCompletions(completions, re) {
        cplEl.empty();
        keyCursor = -1;
        completions.forEach(function (completion) {
          var additional = '';

          if ('string' === typeof completion) {
            val = completion;
          } else {
            val = completion.name;

            if (completion.additional) {
              additional = '<span class="additional">' + completion.additional + '</span>';
            }
          }

          if (re) val = val.replace(re, '<u>$1</u>');
          var completionHtml = $('<li><span class="val">' + val + '</span>' + additional + '</li>');
          el.parent().find('.completions').append(completionHtml);
        });
      }

      function triggerCompletions() {
        var cplEls = cplEl.children();
        var visible = !!cplEls.length;
        if (cplEls.length === 1 &&
            cplEls.eq(0).text() === el.val()) {
          visible = false;
        }
        setVisible(visible);
      }

      // Update the cursor (highlight selected option)
      function updateKeyCursor() {
        var opts = cplEl.find('li');
        keyCursor = Math.max(keyCursor, 0);
        keyCursor = Math.min(keyCursor, opts.length - 1);
        opts.removeClass('cursor');
        opts.eq(keyCursor).addClass('cursor');
      }

      function selectCompletion(liEl) {
        var val = $(liEl).find('.val').text();
        scope.$apply(function () {
          el.val(val);
          ngModel.$setViewValue(val);
          setVisible(false);
          el.blur();
        });
      }

      function escape(str) {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      }

      cplEl.on('click', 'li', function () {
        selectCompletion(this);
      });
    }
  };
}]);

/**
 * Datepicker
 */
module.directive('rpDatepicker', [function() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, element, attr, ngModel) {
      attr.$observe('rpDatepicker', function() {
        var dp = $(element).datepicker({
          format: 'mm/dd/yyyy'
        });
        dp.on('changeDate', function(e) {
          scope.$apply(function () {
            ngModel.$setViewValue(e.date.getMonth() ? e.date : new Date(e.date));
          });
        });
        scope.$watch(attr.ngModel,function() {
          var update = ngModel.$viewValue;

          function falsy(v) {return v == '0' || v == 'false'; }

          if (!falsy(attr.ignoreInvalidUpdate) &&
               (update == null ||
                 (update instanceof Date && isNaN(update.getYear())) )) {
              return;
            }
        });
      });
    }
  };
}]);

module.directive('fileUploadButton', function() {
  return {
    require: '^ngModel',
    link: function(scope, element, attributes) {
      var el = angular.element(element);

      var button = el.children()[0];

      el.css({
        'position': 'relative',
        'margin-bottom': 14
      });

      var fileInput = angular.element('<input type="file" ng-model="walletfile" nwsaveas="wallet.txt" />');

      fileInput.bind('change', function () {
          scope.$apply(attributes.fileUploadButton);
      });

      fileInput.css({
        position: 'absolute',
        top: 0,
        left: 0,
        'z-index': '2',
        width: '100%',
        height: '100%',
        opacity: '0',
        cursor: 'pointer'
      });

      el.append(fileInput);
    }
  };
});

