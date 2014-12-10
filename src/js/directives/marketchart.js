/**
 * Marketchart
 *
 * Directive to render a RippleCharts.com market chart.
 */

var module = angular.module('marketchart', []);

module.directive('rpMarketChart', [function() {
  var lastId = 1;

  return {
    restrict: 'E',
    template: '',
    link: function($scope, element, attrs) {
      // set unique ID
      var $elem       = $(element[0]),
          id          = $elem.attr('id'),
          chart;
      if (!id) {
        id = 'marketchart-' + lastId++;
        $elem.attr('id', id);
      }

      chart = PriceChartWidget({
        id:     id,
        width:  $elem.width() - 100,
        height: $elem.height() - 20,
        margin: {top: 0, right: 50, bottom: 20, left: 50},
        resize: true
      });

      var render = function () {
        if (!attrs.baseCurrency || !attrs.counterCurrency) {
          return;
        }
        var options = {
          base: {
            currency: attrs.baseCurrency,
            issuer:   attrs.baseCurrencyIssuer
                        ? attrs.baseCurrencyIssuer
                        : null
          },
          counter: {
            currency: attrs.counterCurrency,
            issuer:   attrs.counterCurrencyIssuer
                        ? attrs.counterCurrencyIssuer
                        : null
          },

          multiple: 5,
          interval: 'minute',
          theme:    'light',
          type:     'line'
        };
        chart.load(options);
      };

      attrs.$observe('baseCurrency', render);
      attrs.$observe('baseCurrencyIssuer', render);
      attrs.$observe('counterCurrency', render);
      attrs.$observe('counterCurrencyIssuer', render);
    }
  };
}]);
