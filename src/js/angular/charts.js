/**
 * CHARTS
 *
 * Charts and data visualization directives go into this file.
 */

var module = angular.module('charts', []);

/**
 * Trust line graph. (Similar to small box plot.)
 */
module.directive('rpTrustLine', function() {
  function redraw(ctx, data) {
    var trust_l = -data.limit_peer.to_text();
    var trust_r = +data.limit.to_text();
    var balance = +data.balance.to_text();

    // Axis distance to left and right edges
    var axisMargin = 10;
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

    // Calculate minimum and maximum logical point
    var min        = Math.min(balance, trust_l);
    var max        = Math.max(balance, trust_r);
    var scale      = axisLen / (max - min);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

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
      ctx.fillStyle = 'red';
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
    ctx.font = "11px sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(""+balance, f(balance), axisY+highText);
    ctx.fillStyle = '#333';
    ctx.fillText(""+trust_l, f(trust_l), axisY+lowText);
    ctx.fillText(""+trust_r, f(trust_r), axisY+lowText);

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
    template: '<canvas width="200" height="37">',
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
});
