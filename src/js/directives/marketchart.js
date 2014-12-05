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
          id          = $elem.attr("id"),
          windowWidth = $(window).width();
      if (!id) {
        id = 'marketchart-' + lastId++;
        $elem.attr('id', id);
      }

      var render = function () {
        $elem.empty();
        var chart = PriceChartWidget({
          id:     id,
          width:  $elem.width() - 100,
          height: $elem.height() - 40,
          margin: {top: 20, right: 50, bottom: 20, left: 50},
          resize: true
        });

        chart.load({
          base: {
            currency: 'XRP'
          },
          counter: {
            currency: 'USD',
            issuer:   'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
          },

          multiple: 5,
          interval: 'minute',
          theme:    'light',
          type:     'line'
        });
      };

      render();
      // $(window).resize(function () {
      //   var currentWidth = $(window).width();
      //   if (currentWidth !== windowWidth) {
      //     windowWidth = currentWidth;
      //     render();
      //   }
      // });

      attrs.$observe('version', function(value) {
        if (!value) {
          return;
        }

        setVersion(value);
        setData(data);
        setSize(size);
        render();
      });
    }
  };
}]);
