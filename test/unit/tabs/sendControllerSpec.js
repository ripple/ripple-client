'use strict';
var expect = chai.expect;

function run(scope,done) {
  done();
}

describe('SendCtrl', function(){
  var rootScope, scope, controller_injector, dependencies, ctrl, 
      sendForm, network, timeout, spy, mock;

  beforeEach(module("rp"));
  beforeEach(inject(function($rootScope, $controller, $q, $timeout, rpNetwork) {
    network = rpNetwork;
    rootScope = rootScope;
    timeout = $timeout;
    scope = $rootScope.$new();
    scope.currencies_all = [{ name: 'XRP - Ripples', value: 'XRP'}];
    controller_injector = $controller;

    // Stub the sendForm, which should perhaps be tested using
    // End To End tests
    scope.sendForm = { 
      send_destination: {
        $setValidity: function(){}
      },
      $setPristine: function(){},
      $setValidity: function(){}
    };

    scope.check_dt_visibility = function () {};

    dependencies = {
      $scope: scope,
      $element: null,
      $network: network,
      rpId: { 
        loginStatus: true,
        account: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk'
      }
    }

    ctrl = controller_injector("SendCtrl", dependencies);
  }));

  it('should be initialized with defaults', function (done) {
    assert.equal(scope.mode, 'form');
    assert.isObject(scope.send);
    assert.equal(scope.send.currency, 'XRP - Ripples');

    assert.isFalse(scope.show_save_address_form);
    assert.isFalse(scope.addressSaved);
    assert.equal(scope.saveAddressName, '');
    assert.isFalse(scope.addressSaving);

    done()
  });

  it('should reset destination dependencies', function (done) {
    assert.isFunction(scope.reset_destination_deps);
    done();
  });

  describe('updating the destination', function (done) {
    beforeEach(function () {
      scope.send.recipient_address = 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk';
    })

    it('should have a function to do so', function (done) {
      assert.isFunction(scope.update_destination);
      done();
    });

    describe('when the recipient is the same as last time', function (done) {
      beforeEach(function () {
        scope.send.last_recipient = scope.send.recipient_address;
      });

      it('should not reset destination dependencies', function (done) {
        spy = sinon.spy(scope, 'reset_destination_deps');
        scope.update_destination();
        assert(spy.notCalled);
        done();
      });

      it('should not check destination tag visibility', function (done) {
        spy = sinon.spy(scope, 'check_dt_visibility');
        scope.update_destination();
        assert(spy.notCalled);
        done();
      });
    });

    describe('when the recipient is new', function (done) {
      beforeEach(function () {
        scope.send.last_recipient = null;
      });

      it('should reset destination dependencies', function (done) {
        spy = sinon.spy(scope, 'reset_destination_deps');
        scope.update_destination();
        assert(spy.called);
        done();        
      });

      it.skip('should check destination tag visibility', function (done) {
        spy = sinon.spy(scope, 'check_dt_visibility');
        scope.update_destination();
        assert(spy.called);
        done();
      });
    });
  })



  describe('updating the destination remote', function (done) {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.update_destination_remote);
      done();
    });

    it('should validate the federation field by default', function (done) {
      var setValiditySpy = sinon.spy(
        scope.sendForm.send_destination, '$setValidity'); 

      scope.update_destination_remote();
      assert(setValiditySpy.withArgs('federation', true).called);
      done();
    })

    describe('when it is not bitcoin', function (done) {
      beforeEach(function () {
        scope.send.bitcoin = null
      })

      it('should check destination', function (done) {
        var spy = sinon.spy(scope, 'check_destination');
        scope.update_destination_remote();
        assert(spy.calledOnce);
        done();
      });
    });

    describe('when it is bitcoin', function (done) {
      beforeEach(function () {
        scope.send.bitcoin = true;
      });

      it('should update currency constraints', function (done) {
        var spy = sinon.spy(scope, 'update_currency_constraints');

        scope.update_destination_remote();
        spy.should.have.been.calledOnce;
        done();
      });

      it('should not check destination', function (done) {
        var spy = sinon.spy(scope, 'check_destination');
        scope.update_destination_remote();
        assert(!spy.called);
        done();
      });
    })
  })

  it('should check the destination', function (done) {
    assert.isFunction(scope.check_destination);
    done();
  })

  it('should handle paths', function (done) {
    assert.isFunction(scope.handle_paths);
    done();      
  });

  it('should update paths', function (done) {
    assert.isFunction(scope.update_paths);
    done();      
  });

  it('should update the currency constraints', function (done) {
    assert.isFunction(scope.update_currency_constraints);
    done();
  });

  it('should reset the currency dependencies', function (done) {
    assert.isFunction(scope.reset_currency_deps);
    var spy = sinon.spy(scope, 'reset_amount_deps');
    scope.reset_currency_deps();
    assert(spy.calledOnce);
    done();
  });

  it('should update the currency', function (done) {
    assert.isFunction(scope.update_currency);
    done();
  });

  it('should reset the amount dependencies', function (done) {
    assert.isFunction(scope.reset_amount_deps);
    done();
  });

  it('should update the amount', function (done) {
    assert.isFunction(scope.update_amount);
    done();
  });

  it('should update the quote', function (done) {
    assert.isFunction(scope.update_quote);
    done();
  });

  it('should rest the paths', function (done) {
    assert.isFunction(scope.reset_paths);
    done();
  });

  it('should determine if the paths need updating', function (done) {
    assert.isFunction(scope.need_paths_update);
    done();
  })

  it('should cancel the form', function (done) {
    assert.isFunction(scope.cancelConfirm);
    scope.send.alt = '';
    scope.mode = null;

    scope.cancelConfirm();
    assert.equal(scope.mode, 'form');
    assert.isNull(scope.send.alt);
    done();
  });

  it('should reset the address form', function (done) {
    assert.isFunction(scope.resetAddressForm);
    scope.show_save_address_form = true
    scope.addressSaved = true;
    scope.saveAddressName = null;
    scope.addressSaving = true;

    scope.resetAddressForm();
    assert.isFalse(scope.show_save_address_form);
    assert.isFalse(scope.addressSaved);
    assert.equal(scope.saveAddressName, '');
    assert.isFalse(scope.addressSaving);
    done();
  });

  it('should perform a reset goto', function (done) {
    assert.isFunction(scope.reset_goto);
    var mock = sinon.mock(scope);
    mock.expects('reset').once();

    scope.reset_goto();
    mock.verify();
    done();
  });

  describe("handling when the send is prepared", function () {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.send_prepared);
      done();
    });

    it('should set confirm wait to true', function (done) {
      scope.send_prepared();
      assert.isTrue(scope.confirm_wait);
      done();
    });

    it("should set the mode to 'confirm'", function (done) {
      assert.notEqual(scope.mode, 'confirm');
      scope.send_prepared();
      assert.equal(scope.mode, 'confirm');
      done();
    })

    it('should set confirm_wait to false after a timeout', function (done) {
      scope.send_prepared();
      assert.isTrue(scope.confirm_wait);
      // For some reason $timeout.flush() works but then raises an exception
      try { timeout.flush() } 
      catch (e) {}
      assert.isFalse(scope.confirm_wait);
      done();
    });
  });
  
  describe('handling when a transaction send is confirmed', function (done) {
    beforeEach(function () {
      scope.send.recipient_address = 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk';
      scope.tx = { on: function () {} };
    });

    describe("handling a 'propose' event from ripple-lib", function (done) {
      beforeEach(function () {
        var transaction = network.remote.transaction();
      });

      it('should define a function to do so', function (done) {
        assert.isFunction(scope.onTransactionProposed);
        done();
      });

      // This needs some work to get the test to be useful
      // Stub the transaction so that the hash is valid
      it.skip('should call apply', function (done) {
        spy = sinon.spy(scope, '$apply');
        var transaction = network.remote.transaction();
        assert.isObject(transaction);
        assert.isString(transaction.hash);
        scope.onTransactionProposed({}, transaction);
        done();
      });
    });

    describe("handling an 'error' event from ripple-lib", function (done) {
      it('should define a function to do so', function (done) {
        assert.isFunction(scope.onTransactionError);
        done();
      });

      it('should call apply', function (done) {
        spy = sinon.spy(scope, '$apply');
        done();
      });
    });

    it('should have a function to handle send confirmed', function (done) {
      assert.isFunction(scope.send_confirmed);
      done();
    });

    it('should create a transaction', function (done) {
      spy = sinon.spy(network.remote, 'transaction');
      scope.send_confirmed();
      assert(spy.called);
      done();
    });

    it('should listen for a "propsed" event', function (done) {
      done();
    })
  })

  describe('saving an address', function () {
    beforeEach(function () {
      scope.userBlob = {
        data: {
          contacts: []
        }
      };
    });

    it('should have a function to do so', function (done) {
      assert.isFunction(scope.saveAddress);
      done();
    });

    it("should set the addressSaving property to true", function (done) {
      assert.isFalse(scope.addressSaving);
      scope.saveAddress();
      assert.isTrue(scope.addressSaving);
      done();
    })

    it("should listen for blobSave event", function (done) {
      var onBlobSaveSpy = sinon.spy(scope, '$on');
      scope.saveAddress();
      assert(onBlobSaveSpy.withArgs('$blobSave').calledOnce);
      done();
    });

    it("should add the contact to the blob's contacts", function (done) {
      assert(scope.userBlob.data.contacts.length == 0);
      scope.saveAddress();
      assert(scope.userBlob.data.contacts.length == 1);
      done();
    });

    describe('handling a blobSave event', function () {
      describe('having called saveAddress', function () {
        beforeEach(function () {
          scope.saveAddress();
        });

        it('should set addressSaved to true', function (done) {
          assert.isFalse(scope.addressSaved);
          scope.$emit('$blobSave');
          assert.isTrue(scope.addressSaved);
          done();
        });

        it("should set the contact as the scope's contact", function (done) {
          assert.isUndefined(scope.contact);
          scope.$emit('$blobSave');
          assert.isObject(scope.contact);
          done();
        });
      })

      describe('without having called saveAddress', function () {
        it('should not set addressSaved', function (done) {
          assert.isFalse(scope.addressSaved);
          scope.$emit('$blobSave');
          assert.isFalse(scope.addressSaved);
          done(); 
        });
      })
    })
  });

  describe('handling sent transactions', function () {
    it('should update the mode to status', function (done) {
      assert.isFunction(scope.sent);
      assert.equal(scope.mode, 'form');
      scope.sent();
      assert.equal(scope.mode, 'status');
      done();
    })

    it('should listen for transactions on the network', function (done) {
      var remoteListenerSpy = sinon.spy(network.remote, 'on');
      scope.sent();
      assert(remoteListenerSpy.calledWith('transaction'));
      done();
    })

    describe('handling a transaction event', function () {
      it.skip('should apply the scope', function (done) {
        scope.sent();
        var applySpy = sinon.spy(scope, '$apply');
        var data = {
          transaction: {
            hash: 'testhash'
          }
        }

        var stub = sinon.stub(network.remote, 'transaction');
        // Figure out how to stub out and trigger a transaction
        network.remote.emit('transaction', data);

        assert(applySpy.notCalled);
        done(); 
      })
    })
  })
});
