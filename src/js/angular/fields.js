/**
 * FIELDS
 *
 * Angular-powered input components go into this file.
 */

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
          setCompletions(scope.$eval(attrs.rpCombobox)());
          if (cplEl.is(':visible')) {
            el.blur();
          } else {
            setCompletions(scope.$eval(attrs.rpCombobox)());
            el.focus();
          }
        });
      }

      el.keydown(function (e) {
        if (e.which === 38 || e.which === 40) {
          if (!cplEl.children().length) {
            updateCompletions();
          }
          e.preventDefault();

          if (e.which === 38) keyCursor--;
          else keyCursor++;

          updateKeyCursor();
        } else if (e.which === 13) {
          var curEl = cplEl.find('li.cursor');
          if (curEl.length === 1 && cplEl.is(':visible')) {
            e.preventDefault();
            selectCompletion(curEl);
          }
        }
      });

      // Listen for keyup events to enable binding
      el.keyup(function(e) {
        if (e.which >= 37 && e.which <= 40) return;
        if (e.which === 13) return;

        updateCompletions();
      });

      el.focus(function() {
        keyCursor = -1;
        setVisible(!!cplEl.children().length);
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
        var match = ngModel.$viewValue;
        if (!match) return;
        var re = new RegExp('('+match+')', 'i');

        var completions = match.length ? scope.$eval(attrs.rpCombobox)(match) : [];

        // By fading out without updating the completions we get a smoother effect
        if (!completions.length) {
          setVisible(false);
          return;
        }

        setCompletions(completions, re);
        setVisible(!!cplEl.children().length);
      }

      function setCompletions(completions, re) {
        cplEl.empty();
        keyCursor = -1;
        completions.forEach(function (val) {
          if (re) val = val.replace(re, '<u>$1</u>');
          var completion = $('<li>'+val+'</li>');
          el.parent().find('.completions').append(completion);
        });
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

      cplEl.on('click', 'li', function () {
        selectCompletion(this);
      });
    }
  };
}]);
