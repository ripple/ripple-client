/**
 * DATALINKS
 *
 * Data-centric links for things like transactions, accounts etc.
 */

var module = angular.module('datalinks', []);

module.directive('rpLinkTx', [function () {
  return {
    restrict: 'A',
    link: function ($scope, element, attr) {
      var url;
      $scope.$watch(attr.rpLinkTx, function (hash) {
        url = "https://ripple.com/graph?tx_id="+hash;
      });
      element.click(function () {
        if (url) window.open(url, '_blank');
      });
    }
  };
}]);
