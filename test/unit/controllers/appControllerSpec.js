'use strict';
var expect = chai.expect;

function run(scope,done) {
  // This variable means the app controller has run
  scope.$watch("app_loaded", function() { done(); });
  scope.$digest();
}

describe('AppCtrl', function(){
  var scope, rootScope, location, controller_injector, ctrl;
  
  beforeEach(module("rp"));
  beforeEach(inject(function($rootScope, $controller, $q) {
    rootScope = rootScope;
    scope = $rootScope.$new();
    controller_injector = $controller;

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

    ctrl = controller_injector("AppCtrl", dependencies);
  }));
  
  module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  });

  describe('Public Functions', function () {

    it('should be able to reset', function(done) {
      assert.isFunction(ctrl.reset);
      run(scope,done);
    });

    it('should handle when an account is loaded', function(done) {
      assert.isFunction(ctrl.handleAccountLoad);
      run(scope,done);
    });

    it('should handle when an account is unloaded', function(done) {
      assert.isFunction(ctrl.handleAccountUnload);
      run(scope,done);
    });

    it('should handle ripple lines', function(done) {
      assert.isFunction(ctrl.handleRippleLines);
      run(scope,done);
    });

    it('should handle ripple lines error', function(done) {
      assert.isFunction(ctrl.handleRippleLinesError);
      run(scope,done);
    });

    it('should handle offers', function(done) {
      assert.isFunction(ctrl.handleOffers);
      run(scope,done);
    });

    it('should handle offers error', function(done) {
      assert.isFunction(ctrl.handleOffersError);
      run(scope,done);
    });

    it('should handle an account entry', function(done) {
      assert.isFunction(ctrl.handleAccountEntry);
      run(scope,done);
    });

    it('should handle an account transaction', function(done) {
      assert.isFunction(ctrl.handleAccountTx);
      run(scope,done);
    });

    it('should handle and account transaction error', function(done) {
      assert.isFunction(ctrl.handleAccountTxError);
      run(scope,done);
    });

    it('should handle an account event', function(done) {
      assert.isFunction(ctrl.handleAccountEvent);
      run(scope,done);
    });

    it('should process a transaction', function(done) {
      assert.isFunction(ctrl.processTxn);
      run(scope,done);
    });

    it('should update an offer', function(done) {
      assert.isFunction(ctrl.updateOffer);
      run(scope,done);
    });

    it('should update the ripple lines', function(done) {
      assert.isFunction(ctrl.updateLines);
      run(scope,done);
    });

    it('should should update the ripple balance', function(done) {
      assert.isFunction(ctrl.updateRippleBalance);
      run(scope,done);
    });

    it('should compare', function(done) {
      assert.isFunction(ctrl.compare);
      run(scope,done);
    });

    it('should handle the first connection', function(done) {
      assert.isFunction(ctrl.handleFirstConnection);
      run(scope,done);
    });
  });

  describe('Initializing the App Controller', function() {
    it('should be initialized with an empty account', function(done) {
      expect(scope.account).to.be.an('object');
      expect(scope.account).to.be.empty;
      
      run(scope,done);
    });
  });
  
});
