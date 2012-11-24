var module = angular.module('directives', []);

module.directive('ngEnter', function() {
  return function(scope, elm, attrs) {
    elm.bind('keypress', function(e) {
      if (e.charCode === 13) scope.$apply(attrs.ngEnter);
    });
  };
});

module.directive('inlineEdit', function () {
  var previewTemplate = '<span ng-hide="isEditMode" ng-dblclick="isEditMode = true">{{model}}</span>';
  var editTemplate = '<input ng-show="isEditMode" ng-dblclick="isEditMode = false" ng-model="model" />';

  return {
    restrict: 'E',
    scope: { model: '=' },
    template: previewTemplate + editTemplate
  };
});
