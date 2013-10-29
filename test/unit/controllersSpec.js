'use strict';
var expect = chai.expect;

describe('Ridiculous Example Test', function(){
  var test;

  beforeEach(function(){
    test = true;
  });

  it('should be true', function() {
    expect(test).to.be.true;
  });
});

describe.only('AppCtrl', function(){
  var scope, rootScope, location, controller_injector;
  
  beforeEach(module("rp"));
  beforeEach(inject(function($rootScope, $controller, $q) {
    rootScope = rootScope;
    scope = $rootScope.$new();
    controller_injector = $controller;
  }));
  
  module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  });

  it('should be testable', function(done) {
    var dependencies = {
      $rootScope: scope,
      $element: null,
      rpId: {
        init: function() {
          /*console.log('Called: init')*/;
        }
      },
      rpNetwork: {
        listenId :function() {/*console.log('Called: listenId')*/;},
        init: function() {/*console.log('Called: init')*/;
        }
      }
    };
    
    // At this point our scope should be clean
    expect(scope.account).to.equal(undefined);
    
    // We'll instantiate our app controller with our dependencies
    var ctrl = controller_injector("AppCtrl", dependencies);
    
    // We have access to all the inner functions
    expect(ctrl.reset).to.be.a.function;
    
    // This variable means the app controller has run
    scope.$watch("app_loaded", function() { done(); });
    // This will run a digest cycle
    scope.$digest();
  });
});
