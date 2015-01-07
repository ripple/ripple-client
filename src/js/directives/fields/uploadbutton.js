angular
  .module('fields', [])
  .directive('fileUploadButton', function() {
  return {
    require: '^ngModel',
    link: function(scope, element, attributes) {
      var el = angular.element(element);

      var button = el.children()[0];

      el.css({
        'position': 'relative',
        'margin-bottom': 14
      });

      var fileInput = angular.element('<input type="file" ng-model="walletfile" nwsaveas="wallet.txt" />');

      fileInput.bind('change', function () {
          scope.$apply(attributes.fileUploadButton);
      });

      fileInput.css({
        position: 'absolute',
        top: 0,
        left: 0,
        'z-index': '2',
        width: '100%',
        height: '100%',
        opacity: '0',
        cursor: 'pointer'
      });

      el.append(fileInput);
    }
  };
});

