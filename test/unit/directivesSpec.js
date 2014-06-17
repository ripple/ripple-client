'use strict';

describe('validators', function () {
  var compile,scope,document;

  // load the validators code
  beforeEach(module('validators'));

  describe('rpAmount', function() {
    var element = angular.element('<form name="testForm"><input rp-amount ng-model="test"></form>');

    beforeEach(inject(function($compile,$rootScope,$document) {
      compile = $compile;
      scope = $rootScope;
      document = $document;

      angular.element(document[0].body).append(element);
      compile(element)(scope);
    }));

    var digestCheck = function(){
      scope.$digest();

      assert.isTrue(scope.testForm.$valid);
    };

    it('should allow very small numbers', function(){
      scope.test = '0.000000000001234123';
      digestCheck();
    });

    it('should allow very big numbers', function(){
      scope.test = '12312312312312311123';
      digestCheck();
    });

    it('should allow a dot without the leading zero', function(){
      scope.test = '.1';
      digestCheck();
    });

    it('should allow a dot for very small numbers without a leading zero', function(){
      scope.test = '.000000000001234123';
      digestCheck();
    });
  });
});