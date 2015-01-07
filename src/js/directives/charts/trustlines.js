/**
  * Trust line graph. (Similar to small box plot.)
*/
angular
  .module('charts', [])
  .directive('rpTrustLine', ['$filter', function($filter) { 
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
    var axisY      = Math.floor(height / 2);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Parse input data
    var trustL, trustR, balance;
    try {
      trustL  = -data.limit_peer.to_number();
      trustR  = data.limit.to_number();
      balance = data.balance.to_number();
    } catch (e) {
      // In case of invalid input data we simply skip drawing the chart.
      return;
    }

    // Calculate minimum and maximum logical point
    var min        = Math.min(balance, trustL);
    var max        = Math.max(balance, trustR);
    var scale      = axisLen / (max - min);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';

    // Draw balance
    if (balance > 0) {
      ctx.beginPath();
      ctx.rect(f(0), axisY - barWidth, f(balance) - f(0), barWidth);
      ctx.fillStyle = 'green';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.rect(f(balance), axisY, f(0) - f(balance), barWidth);
      ctx.fillStyle = balance === 0 ? 'black' : 'red';
      ctx.fill();
    }

    ctx.beginPath();
    // Draw axis
    ctx.moveTo(f(trustL), axisY);
    ctx.lineTo(f(trustR), axisY);
    // Left end tick
    ctx.moveTo(f(trustL), axisY - tickLen);
    ctx.lineTo(f(trustL), axisY + tickLen);
    // Right end tick
    ctx.moveTo(f(trustR), axisY - tickLen);
    ctx.lineTo(f(trustR), axisY + tickLen);
    // Origin tick
    ctx.moveTo(f(0),       axisY - tickLen);
    ctx.lineTo(f(0),       axisY + tickLen);
    ctx.stroke();

    // Draw labels
    var rpamount = $filter('rpamount');
    var fmt = {rel_precision: 0};
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rpamount(data.balance, fmt), f(balance), axisY + highText);
    ctx.fillStyle = '#333';

    var lAmount = rpamount(data.limit_peer, fmt);

    if (0 !== trustL)
      lAmount = '-' + lAmount;

    if (trustL === trustR && 0 === trustL) {
      lAmount = '0 / 0';
    } else {
      ctx.fillText(rpamount(data.limit, fmt), f(trustR), axisY + lowText);
    }

    ctx.fillText(lAmount, f(trustL), axisY + lowText);

    // Exchange a value to a pixel position
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
    template: '<canvas width="140" height="50">',
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
