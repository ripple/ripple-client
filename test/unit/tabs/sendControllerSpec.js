'use strict';
var expect = chai.expect;

function run(scope,done) {
  done();
}

describe('SendCtrl', function(){
  var rootScope, scope, controller_injector, dependencies, ctrl, 
      sendForm, network, timeout, spy, stub, mock, res, transaction, data;

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

    scope.$apply = function(func){func()};

    scope.saveAddressForm = {
      $setPristine: function () {}
    }

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

      it('should check destination tag visibility', function (done) {
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

  describe('updating currency constraints', function () {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.update_currency_constraints);
      done();
    });

    it('should update the currency', function (done) {
      stub = sinon.stub(scope, 'update_currency');
      scope.update_currency_constraints();
      assert(spy.called);
      done();
    });

    describe('when recipient info is not loaded', function () {
      it('should not update the currency', function (done) {
        stub = sinon.stub(scope, 'update_currency');
        scope.send.recipient_info.loaded = false;
        scope.update_currency_constraints();
        assert(spy.called);
        done();
      });
    });
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

  describe('resetting the amount dependencies', function (done) {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.reset_amount_deps);
      done();
    });

    it('should set the quote to false', function (done) {
      scope.send.quote = true;
      scope.reset_amount_deps();
      assert.isFalse(scope.send.quote);
      done();
    });

    it('should falsify the sender insufficient xrp flag', function (done) {
      scope.send.sender_insufficient_xrp = true;
      scope.reset_amount_deps();
      assert.isFalse(scope.send.sender_insufficient_xrp);
      done();
    });

    it('should reset the paths', function (done) {
      spy = sinon.spy(scope, 'reset_paths');
      scope.reset_amount_deps();
      assert(spy.calledOnce);
      done();
    });
  });

  it('should update the amount', function (done) {
    assert.isFunction(scope.update_amount);
    done();
  });

  it('should update the quote', function (done) {
    assert.isFunction(scope.update_quote);
    done();
  });

  describe('resetting paths', function (done) {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.reset_paths);
      done();
    });

    it('should check if it needs a path update', function (done) {
      spy = sinon.stub(scope, 'need_paths_update');
      scope.reset_paths();
      assert(spy.called);
      done();
    });

    describe("when it needs a path update", function () {
      beforeEach(function () {
        scope.send.alternatives = null;
      });
      it('should set the send alternatives to an empty array', function (done) {
        spy = sinon.stub(scope, 'need_paths_update').returns(true);
        scope.reset_paths();
        assert(Array.isArray(scope.send.alternatives));
        assert.equal(scope.send.alternatives.length, 0);
        done();
      });
    });

    describe("when it doesn't need a path update", function () {
      beforeEach(function () {
        scope.send.alternatives = null;
      });
      it('should not set the send alternatives', function (done) {
        spy = sinon.stub(scope, 'need_paths_update').returns(false);
        assert.equal(scope.send.alternatives, null);
        done();
      });
    });
  });

  describe("checking that paths need updating", function () {
    describe("when the recipient is the last recipient", function() {
      beforeEach(function () {
        scope.send.recipient_actual = 'steven';
        scope.send.last_am_recipient = 'steven';
      });

      describe('and there is no last amount', function () {
        beforeEach(function () {
          scope.send.last_amount = null;
        });

        it('should return true', function (done) {
          assert(scope.need_paths_update());
          done();
        });
      });

      describe('and there is a last amount', function () {
        beforeEach(function () {
          scope.send.last_amount = { is_valid: function () {} };
        });

        describe('when the last amount is not valid', function () {
          beforeEach(function () {
            sinon.stub(scope.send.last_amount, 'is_valid').returns(false);  
          });    

          it('should return true', function (done) {
            assert(scope.need_paths_update());
            done();
          });    
        });

        describe('when the last amount is valid', function () {
          beforeEach(function () {
            sinon.stub(scope.send.last_amount, 'is_valid').returns(true);  
            scope.send.amount_actual = {
              is_valid: function () {},
              equals: function () {}
            }
          });

          describe("when the amount is not valid", function (done) {
            beforeEach(function () {
              sinon.stub(scope.send.amount_actual, 'is_valid').returns(false);  
            });

            it('should return true', function (done) {
              assert(scope.need_paths_update());
              done();
            });  
          })

          describe("when the amount is valid", function () {
            beforeEach(function () {
              sinon.stub(scope.send.amount_actual, 'is_valid').returns(true);
            });

            describe('and the amount equals the last amount', function () {
              it('should return true', function (done) {
                sinon.stub(scope.send.amount_actual, 'equals').returns(true)
                assert(!scope.need_paths_update());
                done();
              });  
            });

            describe('and the amount does not equal the last amount', function () {
              it('should return false', function (done) {
                sinon.stub(scope.send.amount_actual, 'equals').returns(false)
                assert(scope.need_paths_update());
                done();
              });  
            });
          })
        });
      });
    });

    describe("when the recipient is not the last recipient", function() {
      beforeEach(function () {
        scope.send.recipient_actual = 'steven';
        scope.send.last_am_recipient = 'jay';
      });

      it('should return true', function (done) {
        assert(scope.need_paths_update());
        done();
      });
    });
    /*
      return send.last_am_recipient !== recipient ||
        !send.last_amount ||
        !send.last_amount.is_valid() ||
        !amount.is_valid() ||
        !amount.equals(send.last_amount);
    };
    */
  })

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

  describe('resetting the address form', function () {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.resetAddressForm);
      done();
    });

    it('should falsify show_save_address_form field', function (done) {
      scope.show_save_address_form = true
      scope.resetAddressForm();
      assert.isFalse(scope.show_save_address_form);
      done();
    });

    it('should falsify the addressSaved field', function (done) {
      scope.addressSaved = true;
      scope.resetAddressForm();
      assert.isFalse(scope.addressSaved);
      done();
    });

    it('should falsify the addressSaving field', function (done) {
      scope.saveAddressName = null;
      scope.resetAddressForm();
      assert.equal(scope.saveAddressName, '');
      done();
    });

    it('should empty the saveAddressName field', function (done) {
      scope.addressSaving = true;
      scope.resetAddressForm();
      assert.isFalse(scope.addressSaving);
      done();
    });

    it('should set the form to pristine state', function (done) {
      spy = sinon.spy(scope.saveAddressForm, '$setPristine');
      scope.resetAddressForm();
      assert(spy.calledOnce);
      done();
    });
  });

  describe('performing reset goto', function () {
    it('should have a function to do so', function (done) {
      assert.isFunction(scope.reset_goto);
      done();
    });

    it('should reset the scope', function (done) {
      spy = sinon.spy(scope, 'reset');
      scope.reset_goto();
      assert(spy.calledOnce);
      done();
    });

    it('should navigate the page to the tabname provide', function (done) {
      var tabName = 'someAwesomeTab';
      scope.reset_goto(tabName);
      assert.equal(document.location.hash, '#' + tabName);
      done();
    });
  })

  it('should perform a reset goto', function (done) {
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
    });

    describe("handling a 'propose' event from ripple-lib", function (done) {
      beforeEach(function () {
        scope.send = {
          amount_feedback: {
            currency: function () {
              function to_human () {
                return 'somestring';
              }
              return { to_human: to_human }
            }
          }
        }

        transaction = {
          hash: 'E64165A4ED2BF36E5922B11C4E192DF068E2ADC21836087DE5E0B1FDDCC9D82F'
        }

        res = {
          engine_result: 'arbitrary_engine_result',
          engine_result_message: 'arbitrary_engine_result_message'
        }
      });

      it('should call send with the transaction hash', function (done) {
        spy = sinon.spy(scope, 'sent');
        scope.onTransactionProposed(res, transaction);
        assert(spy.calledWith(transaction.hash));
        done();
      });

      it('should set the engine status with the response', function (done) {
        spy = sinon.spy(scope, 'setEngineStatus');        
        scope.onTransactionProposed(res, transaction);
        assert(spy.called);
        done();
      });
    });

    describe("handling errors from the server", function () {
      describe("any error", function (done) {
        it('should set the mode to error', function (done) {
          var res = { error: null };
          scope.onTransactionError(res, null);
          setTimeout(function (){
            assert.equal(scope.mode, "error");
            done();
          }, 10)
        });
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

  describe('setting engine status', function () {
    beforeEach(function () {
      res = {
        engine_result: 'arbitrary_engine_result',
        engine_result_message: 'arbitrary_engine_result_message'
      }
    });

    describe("when the response code is 'tes'", function() {
      beforeEach(function () {
        res.engine_result = 'tes';
      })

      describe('when the transaction is accepted', function () {
        it("should set the transaction result to cleared", function (done) {
          var accepted = true;
          scope.setEngineStatus(res, accepted);
          assert.equal(scope.tx_result, 'cleared');
          done();
        });
      });

      describe('when the transaction not accepted', function () {
        it("should set the transaction result to pending", function (done) {
          var accepted = false;
          scope.setEngineStatus(res, accepted);
          assert.equal(scope.tx_result, 'pending');
          done();
        });
      });
    });

    describe("when the response code is 'tep'", function() {
      beforeEach(function () {
        res.engine_result = 'tep';
      })

      it("should set the transaction result to partial", function (done) {
        scope.setEngineStatus(res, true);
        assert.equal(scope.tx_result, 'partial');
        done();
      });
    });
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
      beforeEach(function () {
        var hash = 'testhash';
        scope.sent(hash);
        data = {
          transaction: {
            hash: hash
          }
        }

        stub = sinon.stub(scope, 'setEngineStatus');
      });

      afterEach(function () {
        scope.setEngineStatus.restore();
      })

      it('should set the engine status', function (done) {
        network.remote.emit('transaction', data);
        assert(stub.called);
        done();
      });

      it('should stop listening for transactions', function (done) {
        spy = sinon.spy(network.remote, 'removeListener');
        network.remote.emit('transaction', data);
        assert(spy.called);
        done(); 
      })

    })
  })
});
