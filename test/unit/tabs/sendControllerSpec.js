'use strict';
var expect = chai.expect;

function run(scope,done) {
  done();
}

describe('SendCtrl', function(){
  var rootScope, scope, controller_injector, dependencies, ctrl;

  beforeEach(module("rp"));
  beforeEach(inject(function($rootScope, $controller, $q) {
    rootScope = rootScope;
    scope = $rootScope.$new();
    scope.currencies_all = [{ name: 'XRP - Ripples', value: 'XRP'}];
    controller_injector = $controller;
  }));

  describe('initializing the controller', function () {
    it('should be initialized with defaults', function (done) {

      dependencies = {
        $scope: scope,
        $element: null,
        rpId: { loginStatus: true }
      }

      ctrl = controller_injector("SendCtrl", dependencies);
      assert.equal(scope.mode, 'form');
      assert.isObject(scope.send);
      assert.equal(scope.send.currency, 'XRP - Ripples');

      assert.isFalse(scope.show_save_address_form);
      assert.isFalse(scope.addressSaved);
      assert.equal(scope.saveAddressName, '');
      assert.isFalse(scope.addressSaving);

      done();
    })
  });

});
