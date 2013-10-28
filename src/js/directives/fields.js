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
            complFn = webutil.queryFromOptions(complFn);
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

      el.keydown(function (e) {
        if (e.which === 38 || e.which === 40) { // UP/DOWN
          if (!cplEl.children().length) {
            updateCompletions();
          }
          e.preventDefault();

          if (e.which === 38) keyCursor--;
          else keyCursor++;

          updateKeyCursor();
        } else if (e.which === 13) { // ENTER
          var curEl = cplEl.find('li.cursor');
          if (cplEl.is(':visible')) {
            e.preventDefault();
          }
          if (cplEl.find('li').length === 1) {
            // Only one completion, we'll assume that's the one they want
            selectCompletion(cplEl.find('li'));
          } else if (curEl.length === 1) {
            selectCompletion(curEl);
          }
        } else if (e.which === 27) { // ESC
          setVisible(false);
        }
      });

      // Listen for keyup events to enable binding
      el.keyup(function(e) {
        if (e.which >= 37 && e.which <= 40) return;
        if (e.which === 13 || e.which === 27) return;

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

      function updateCompletions() {
        var match = ngModel.$viewValue,
            completions = [], re = null,
            complFn;

        complFn = scope.$eval(attrs.rpCombobox);

        if ("function" !== typeof complFn) {
          complFn = webutil.queryFromOptions(complFn);
        }

        if ("string" === typeof match && match.length) {
          var escaped = webutil.escapeRegExp(match);
          re = new RegExp('('+escaped+')', 'i');
          completions = complFn(match, re);
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
        completions.forEach(function (val) {
          val = escape(val);
          if (re) val = val.replace(re, '<u>$1</u>');
          var completion = $('<li>'+val+'</li>');
          el.parent().find('.completions').append(completion);
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

      function updateKeyCursor() {
        var opts = cplEl.find('li');
        keyCursor = Math.max(keyCursor, 0);
        keyCursor = Math.min(keyCursor, opts.length - 1);
        opts.removeClass('cursor');
        opts.eq(keyCursor).addClass('cursor');
      }

      function selectCompletion(liEl) {
        var val = $(liEl).text();
        scope.$apply(function () {
          el.val(val);
          ngModel.$setViewValue(val);
          setVisible(false);
        });
      }

      function escape(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
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
        var dp = $(element).datepicker();
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
            } else {
              dp.datepicker('setValue', update)
                .datepicker('update');
            }
        });
      });
    }
  };
}]);
