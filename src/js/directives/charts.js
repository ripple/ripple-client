/**
 * CHARTS
 *
 * Charts and data visualization directives go into this file.
 */

var module = angular.module('charts', []);

/**
 * Trust line graph. (Similar to small box plot.)
 */
module.directive('rpTrustLine', ['$filter', function($filter) {
  function redraw(ctx, data) {
    // Axis distance to left and right edges
    var axisMargin = 30;
    // Tick length away from axis
    var tickLen    = 5;
    // Thickness of bars
    var barWidth   = 6;
    // Offset for text below axis
    var lowText    = 16;
    // Offset for text above bar
    var highText   = -10;

    // Fetch size of canvas
    var width      = ctx.canvas.width;
    var height     = ctx.canvas.height;
    var axisLen    = width - axisMargin * 2;
    var axisY      = Math.floor(height/2);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Parse input data
    var trust_l, trust_r, balance;
    try {
      trust_l = -data.limit_peer.to_number();
      trust_r = data.limit.to_number();
      balance = data.balance.to_number();
    } catch (e) {
      // In case of invalid input data we simply skip drawing the chart.
      return;
    }

    // Calculate minimum and maximum logical point
    var min        = Math.min(balance, trust_l);
    var max        = Math.max(balance, trust_r);
    var scale      = axisLen / (max - min);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';

    // Draw balance
    if (balance > 0) {
      ctx.beginPath();
      ctx.rect(f(0), axisY-barWidth, f(balance)-f(0), barWidth);
      ctx.fillStyle = 'green';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.rect(f(balance), axisY, f(0)-f(balance), barWidth);
      ctx.fillStyle = balance === 0 ? 'black' : 'red';
      ctx.fill();
    }

    ctx.beginPath();
    // Draw axis
    ctx.moveTo(f(trust_l), axisY);
    ctx.lineTo(f(trust_r), axisY);
    // Left end tick
    ctx.moveTo(f(trust_l), axisY-tickLen);
    ctx.lineTo(f(trust_l), axisY+tickLen);
    // Right end tick
    ctx.moveTo(f(trust_r), axisY-tickLen);
    ctx.lineTo(f(trust_r), axisY+tickLen);
    // Origin tick
    ctx.moveTo(f(0),       axisY-tickLen);
    ctx.lineTo(f(0),       axisY+tickLen);
    ctx.stroke();

    // Draw labels
    var rpamount = $filter('rpamount');
    var fmt = {rel_precision: 0};
    ctx.font = "11px sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(rpamount(data.balance, fmt), f(balance), axisY+highText);
    ctx.fillStyle = '#333';

    var lAmount = rpamount(data.limit_peer, fmt);

    if (0 !== trust_l)
      lAmount = "-"+lAmount;

    if (trust_l === trust_r && 0 === trust_l) {
      lAmount = "0 / 0";
    } else {
      ctx.fillText(rpamount(data.limit, fmt), f(trust_r), axisY+lowText);
    }

    ctx.fillText(lAmount, f(trust_l), axisY+lowText);

    // Convert a value to a pixel position
    function f(val)
    {
      // Enforce limits
      val = Math.min(val, max);
      val = Math.max(val, min);
      return Math.round((val - min) * scale + axisMargin);
    }
  }

  return {
    restrict: 'E',
    template: '<canvas width="200" height="50">',
    scope: {
      data: '=rpLineData'
    },
    link: function(scope, elm, attrs) {
      var ctx = elm.find('canvas')[0].getContext('2d');

      redraw(ctx, scope.data);

      scope.$watch('data', function () {
        redraw(ctx, scope.data);
      }, true);
    }
  };
}]);
