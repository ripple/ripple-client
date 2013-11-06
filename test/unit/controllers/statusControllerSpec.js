'use strict';
var expect = chai.expect;

function run(scope,done) {
  done();
}

describe('StatusCtrl', function(){
  var rootScope, scope, controller_injector, dependencies, ctrl;

  beforeEach(module("rp"));
  beforeEach(inject(function($rootScope, $controller, $q) {
    rootScope = rootScope;
    scope = $rootScope.$new();
    controller_injector = $controller;

    dependencies = {
      $scope: scope,
      $element: null
    }

    ctrl = controller_injector("StatusCtrl", dependencies);
  }));

  describe('initializing the controller', function () {
    it('should initialize properly', function (done) {
      assert.isNotNull(ctrl);
      run(scope,done);
    });

    it('should set up the scope with defaults', function (done) {
      run(scope,done);
      assert.isUndefined(scope.show_secondary);
    })

    it('should be set up with sinon', function (done) {
      assert.isNotNull(sinon);
      assert.isFunction(sinon.spy);
      run(scope,done);
    });

    it('should be disconnected by default', function (done) {
      assert.isUndefined(scope.connected);
      done();
    });

  });

  describe('public functions on $scope', function () {

    it('should toggle the secondary', function (done) {
      assert.isFunction(scope.toggle_secondary);

      scope.toggle_secondary();
      expect(scope.show_secondary).to.be.true;

      scope.toggle_secondary();
      expect(scope.show_secondary).to.be.false;

      run(scope,done);
    });

    it('should logout', function (done) {
      assert.isFunction(scope.logout);
      run(scope,done);
    });
  });

  describe('private functions', function() {

    it('should set the connection status', function (done) {
      assert.isFunction(ctrl.setConnectionStatus);
      run(scope,done);
    });

    it('should enqueue', function (done) {
      assert.isFunction(ctrl.enqueue);
      run(scope,done);
    });

    it('should tick', function (done) {
      assert.isFunction(ctrl.tick);
      run(scope,done);
    });

  });
});
