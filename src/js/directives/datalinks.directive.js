/**
 * DATALINKS
 *
 * Data-centric links for things like transactions, accounts etc.
 */

var module = angular.module('datalinks', []);

module.directive('rpLinkTx', ['$location', function ($location) {
  return {
    restrict: 'A',
    link: function ($scope, element, attr) {
      var url;
      $scope.$watch(attr.rpLinkTx, function (hash) {
        url = "/tx?id="+hash;
      });
      element.click(function () {
        $scope.$apply(function () {
          if (url) $location.url(url);
        });
      });
    }
  };
}]);
