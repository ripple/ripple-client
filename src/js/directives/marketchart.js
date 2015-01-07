/**
 * Marketchart
 *
 * Directive to render a RippleCharts.com market chart.
 */

angular
  .module('marketchart', [])
  .directive('rpMarketChart', [function() {
  var lastId = 1;

  return {
    restrict: 'E',
    template: '',
    link: function($scope, element, attrs) {
      // set unique ID
      var $elem       = $(element[0]),
          chart       = false;
      var render = function () {
        if (!attrs.baseCurrency || !attrs.counterCurrency) {
          return;
        }

        var start = new Date();
        start.setDate(start.getDate()-1);

        if (!chart) {
          var id  = $elem.attr('id');
          if (!id) {
            id = 'marketchart-' + lastId++;
            $elem.attr('id', id);
          }

          chart = PriceChartWidget({
            id:     id,
            width:  $elem.width() - 120,
            height: $elem.height() - 30,
            margin: {top: 10, right: 70, bottom: 20, left: 50},
            resize: true
          });
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
          start: start,
          end: new Date(),
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
