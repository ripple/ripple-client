/**
 * Something similar to javascript for loop
 *
 * Usage
 * Example1 : ng-repeat="n in [20] | rprange"
 * Example2 : ng-repeat="n in [10, 35] | rprange"
 */
angular
  .module('filters', [])
  .filter('rprange', function() {
  return function(input) {
    var lowBound, highBound;
    switch (input.length) {
      case 1:
        lowBound = 0;
        highBound = parseInt(input[0], 10) - 1;
        break;
      case 2:
        lowBound = parseInt(input[0], 10);
        highBound = parseInt(input[1], 10);
        break;
      default:
        return input;
    }
    var result = [];
    for (var i = lowBound; i <= highBound; i++)
      result.push(i);
    return result;
  };
});
