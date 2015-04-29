
(function() {
  // 'use strict';

  /* global ripple: false, angular: false, _: false, jQuery: false, store: false, Options: false */

  function AddressPopover($timeout, id, $filter, $parse, scope, element, attr) {
    this.$timeout = $timeout;
    this.$parse = $parse;
    this.scope = scope;
    this.element = element;

    this.cancelHidePopoverTimeout = null;
    this.cancelShowPopoverTimeout = null;
    this.tip = null;
    this.shown = false;
    this.identity = '';
    this.summ = '';
    this.rippleName = '';
    this.rpamountFilter = $filter('rpamount');
    this.popoverCreated = false;
    this.rpAddressPopoverSum = attr.rpAddressPopoverSum;
    this.rpAddressPopoverSumMinus = attr.rpAddressPopoverSumMinus;

    if (attr.rpAddressPopover && attr.rpAddressPopover != 'rp-address-popover') {
      this.identity = $parse(attr.rpAddressPopover)(scope);
    }

    this.onPopoverEnterBound = null;
    this.onPopoverLeaveBound = null;
    this.onElemLeaveBound = null;
    this.onElemEnterBound = this.onElemEnter.bind(this);
    element.bind('mouseenter', this.onElemEnterBound);

    var _this = this;
    if (attr.rpAddressPopoverLinkToCharts) {
      id.resolveName(this.identity, { tilde: true }).then(function(name) {
        _this.rippleName = name;
        if (_this.popoverCreated) {
          var data = element.data('popover');
          if (data) {
            data.options.content = _this.makeContent();
            data.setContent();
          }
        }
      });
    }

    // Make sure popover is destroyed and removed.
    scope.$on('$destroy', function onDestroyPopover() {
      $timeout.cancel(_this.cancelHidePopoverTimeout);
      _this.cancelHidePopoverTimeout = null;
      $timeout.cancel(_this.cancelShowPopoverTimeout);
      _this.cancelShowPopoverTimeout = null;
      _this.unbindHanlders();
      if (_this.tip) {
        _this.tip.remove();
        _this.tip = null;
      }
      this.scope = null;
      this.element = null;
      this.onPopoverEnterBound = null;
      this.onPopoverLeaveBound = null;
      this.onElemLeaveBound = null;
      this.onElemEnterBound = null;
    });
  }

  AddressPopover.popupDelay = 800;
  AddressPopover.hideDelay =  700;
  AddressPopover.summFilterOpts = { force_precision: 100, min_precision: 2 };

  AddressPopover.prototype.create = function() {
    if (this.rpAddressPopoverSum) {
      var nowSumm = this.$parse(this.rpAddressPopoverSum)(this.scope);
      nowSumm = this.rpamountFilter(nowSumm, AddressPopover.summFilterOpts);
      if (nowSumm != this.summ) {
        if (this.rpAddressPopoverSumMinus && nowSumm != 'n/a') {
          nowSumm = '-' + nowSumm;
        }
        this.summ = nowSumm;
      }
    }

    var options = {
      content: this.makeContent(),
      html: true,
      trigger: 'manual', placement: 'top',
      container: 'body',
      template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><div class="popover-content"></div></div></div>'
    };

    var popover = this.element.popover(options);
    this.tip = this.element.data('popover').tip();
    this.onPopoverEnterBound = this.onPopoverEnter.bind(this);
    this.tip.bind('mouseenter', this.onPopoverEnterBound);
    this.onPopoverLeaveBound = this.onPopoverLeave.bind(this);
    this.tip.bind('mouseleave', this.onPopoverLeaveBound);
    this.popoverCreated = true;
  }

  AddressPopover.prototype.makeContent = function() {
    var htmlContent = ['<div>'];
    if (this.summ) {
      htmlContent.push('<div>', String(this.summ), '</div>');
    }

    if (this.rippleName) {
      if (this.rippleName !== this.identity) {
        htmlContent.push('<div>', this.rippleName, '</div>');
      }
      htmlContent.push('<span>', this.identity, '</span>', '<br/>');
      htmlContent.push('<a target="_blank", href="http://www.ripplecharts.com/#/graph/', this.identity, '" >', AddressPopover.textShowInGraph, '</a>');
    } else if (this.identity) {
      htmlContent.push(AddressPopover.textRippleAddress, ' ', this.identity);
    }
    htmlContent.push('</div>');
    return htmlContent.join('');
  }

  AddressPopover.prototype.showPopover = function() {
    if (!this.popoverCreated) {
      this.create();
    }

    var _this = this;
    // allow $compile to bind values to template
    this.$timeout(function() {
      _this.element.popover('show');
      _this.shown = true;
    }, 10, false);
  }

  AddressPopover.prototype.hidePopover = function() {
    if (!this.cancelHidePopoverTimeout) {
      var _this = this;
      this.cancelHidePopoverTimeout = this.$timeout(function() {
        _this.element.popover('hide');
        _this.shown = false;
      }, AddressPopover.hideDelay, false);
      this.cancelHidePopoverTimeout['finally'](function() {
        _this.cancelHidePopoverTimeout = null;
      });
    }
  }

  AddressPopover.prototype.onPopoverEnter = function() {
    if (this.cancelShowPopoverTimeout) {
      this.$timeout.cancel(this.cancelShowPopoverTimeout);
      this.cancelShowPopoverTimeout = null;
    }
    if (this.cancelHidePopoverTimeout) {
      this.$timeout.cancel(this.cancelHidePopoverTimeout);
      this.cancelHidePopoverTimeout = null;
    }
  }

  AddressPopover.prototype.onPopoverLeave = function() {
    this.hidePopover();
  }

  AddressPopover.prototype.onElemEnter = function() {
    if (!this.onElemLeaveBound) {
      this.onElemLeaveBound = this.onElemLeave.bind(this)
      this.element.bind('mouseleave', this.onElemLeaveBound);
    }

    if (this.cancelHidePopoverTimeout) {
      this.$timeout.cancel(this.cancelHidePopoverTimeout);
      this.cancelHidePopoverTimeout = null;
    } else if (!this.cancelShowPopoverTimeout) {
      this.cancelShowPopoverTimeout = this.$timeout(this.showPopover.bind(this), AddressPopover.popupDelay, false);
      this.cancelShowPopoverTimeout['finally'](this.onCancelShowPopoverTimeoutFinally.bind(this));
    }
  }

  AddressPopover.prototype.onCancelShowPopoverTimeoutFinally = function() {
    this.cancelShowPopoverTimeout = null;
  }

  AddressPopover.prototype.onElemLeave = function() {
    if (this.cancelShowPopoverTimeout) {
      this.$timeout.cancel(this.cancelShowPopoverTimeout);
      this.cancelShowPopoverTimeout = null;
    } else if (this.shown) {
      this.hidePopover();
    }
  }

  AddressPopover.prototype.unbindHanlders = function() {
    this.element.unbind('mouseenter', this.onElemEnterBound);
    this.element.unbind('mouseleave', this.onElemLeaveBound);

    if (this.tip) {
      this.tip.unbind('mouseenter', this.onPopoverEnterBound);
      this.tip.unbind('mouseleave', this.onPopoverLeaveBound);
    }
  }

  AddressPopover.textRippleAddress = 'span(l10n) Ripple address';
  AddressPopover.textShowInGraph = 'span(l10n) Show in graph';

  /**
   * Special popover to show ripple address with ability to double click on address to select.
   * Also can link to www.ripplecharts.com.
   * rp-address-popover-link-to-charts - show ling to ripple charts
   * rp-address-popover-sum - show full sum of according model in popover
   * rp-address-popover-sum-minus - put minus sign before sum
   */
  angular.module('directives').directive('rpAddressPopover', rpAddressPopover);

  rpAddressPopover.$inject = ['$timeout', 'rpId', '$filter', '$parse', '$templateRequest'];

  function rpAddressPopover($timeout, id, $filter, $parse, $templateRequest) {
    $templateRequest('templates/' + window.lang + '/directives/addresspopover.html', false).then(function(template) {
      var texts = template.split('<br/>');
      AddressPopover.textRippleAddress = texts[0];
      AddressPopover.textShowInGraph = texts.length > 1 ? texts[1] : AddressPopover.textShowInGraph;
    });

    return {
      restrict: 'A',
      replace: false,
      compile: function (element, attr, linker) {
        return function (scope, element, attr) {
          var p = new AddressPopover($timeout, id, $filter, $parse, scope, element, attr);
        };
      }
    };
  }
})();
