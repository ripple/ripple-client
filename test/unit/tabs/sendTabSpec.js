'use strict';

describe('SendCtrl', function(){
  var scope, dependencies, ctrl, network;

  beforeEach(module("rp"));
  beforeEach(inject(function($rootScope, $controller, rpNetwork) {
    scope = $rootScope.$new();
    network = rpNetwork;

    scope.currencies_all = [{ name: 'Ripples', value: 'XRP'}];

    scope.currencies_all_keyed = {
      "XRP": {
        "value": "XRP",
        "name": "Ripples",
        "order": 5
      },
      "USD": {
        "value": "USD",
        "name": "US Dollar",
        "order": 4
      },
      "BTC": {
        "value": "BTC",
        "name": "Bitcoin",
        "order": 2
      },
      "XAU": {
        "value": "XAU",
        "name": "Gold",
        "order": 0
      }
    };

    dependencies = {
      $scope: scope,
      $element: null,
      $network: rpNetwork,
      rpId: {
        loginStatus: true,
        account: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk'
      }
    };

    // Stub the sendForm,
    // which should perhaps be tested using End To End tests
    scope.sendForm = {
      send_destination: {
        $setValidity: function(){}
      },
      $setPristine: function(){},
      $setValidity: function(){}
    };

    // Stub the userBlob
    // also more suitable for end to end tests
    scope.userBlob = {
      data: {
        contacts: []
      },
      unshift : function() {}
    };

    ctrl = $controller("SendCtrl", dependencies);
  }));

  it('should be initialized with defaults', function (done) {
    assert.isObject(scope.xrp);
    assert.strictEqual(scope.xrp.name, 'Ripples');
    assert.isObject(scope.send);
    assert.strictEqual(scope.send.currency, 'Ripples');
    assert.strictEqual(scope.send.currency_code, 'XRP');
    assert.strictEqual(scope.send.currency_choices.length, 0);

    done();
  });

  describe('setting trust lines', function() {

    it('should update currency_choices after setting trust lines', function(done) {

      scope.lines = {
        "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BUSD": {
          "account": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
          "currency": "USD"
        },
        "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2qUSD": {
          "account": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
          "currency": "USD"
        },
        "rhXzSyt1q9J8uiFXpK3qSugAAPJKXLtnrFUSD": {
          "account": "rhXzSyt1q9J8uiFXpK3qSugAAPJKXLtnrF",
          "currency": "USD"
        },
        "rs9M85karFkCRjvc6KMWn8Coigm9cbcgcx015841551A748AD2C1F76FF6ECB0CCCD00000000": {
          "account": "rs9M85karFkCRjvc6KMWn8Coigm9cbcgcx",
          "currency": "015841551A748AD2C1F76FF6ECB0CCCD00000000"
        }
      };

      // kicks off watches
      scope.$apply();

      assert.strictEqual(scope.send.currency_choices[0], 'XRP - Ripples');
      assert.strictEqual(scope.send.currency_choices[1], 'USD - US Dollar');
      assert.strictEqual(scope.send.currency_choices[2], 'XAU - Gold (-0.5%pa)');

      done();
    });

  });

  describe('setting a receiver', function() {

    beforeEach(function() {
      scope.send.recipient = "rwyxXB3hEvUHhjo6NUJ2SFcWJfmciBQ1rt";
      scope.send.recipient_info = {
        'loaded': true,
        'exists': true,
        'Balance': {},

        // Flags
        'disallow_xrp': 0,
        'dest_tag_required': 0
      };

      // should call update_destination after setting a receiver
      scope.update_destination = sinon.spy();
      scope.$apply();
      assert.isTrue(scope.update_destination.calledOnce);
    });

    it("should update the currency_choices with the receiver's options", function(done) {

      var recipient_currencies = ["BEE", "BRL", "DPD", "FLO", "FRI", "GUM", "LTC", "NMC", "PPC", "SFO", "TDO", "TIK", "TIM", "USD", "XAU", "015841551A748AD2C1F76FF6ECB0CCCD00000000"];
      scope.update_currency_choices(recipient_currencies);

      // +1 since XRP is added
      assert.strictEqual(scope.send.currency_choices.length, recipient_currencies.length + 1);

      assert.isTrue(_.contains(scope.send.currency_choices, "XRP - Ripples"));
      assert.isTrue(_.contains(scope.send.currency_choices, "XAU - Gold"));
      assert.isTrue(_.contains(scope.send.currency_choices, "TIM"));
      assert.isTrue(_.contains(scope.send.currency_choices, "XAU - Gold (-0.5%pa)"));

      done();
    });

    it("shouldn't add XRP as an option if the receiver disallows XRP", function(done) {
      scope.send.recipient_info.disallow_xrp = 1;
      scope.$apply();

      var recipient_currencies = ["BEE", "BRL", "DPD", "FLO", "FRI", "GUM", "LTC", "NMC", "PPC", "SFO", "TDO", "TIK", "TIM", "USD", "XAU", "015841551A748AD2C1F76FF6ECB0CCCD00000000"];
      scope.update_currency_choices(recipient_currencies);

      assert.strictEqual(scope.send.currency_choices.length, recipient_currencies.length);

      done();
    });

    // currently not working, filters prohibit the recipient watch to be fired
    it.skip("should reset if the recipient is not valid", function(done) {
      scope.send.recipient = "asdfas";

      scope.reset_currency_deps = sinon.spy();

      scope.$apply();

      assert.strictEqual(scope.send.currency_choices[0], 'XRP - Ripples');
      assert.strictEqual(scope.send.currency_choices[1], 'USD - US Dollar');
      assert.strictEqual(scope.send.currency_choices[2], 'XAU - Gold (-0.5%pa)');

      assert.isTrue(scope.reset_currency_deps.calledOnce);

      done();
    });

  });

  describe('saving an address', function() {

    it("should add the address to the blob", function (done) {
      scope.userBlob.unshift = sinon.spy();
      assert.isFalse(scope.userBlob.unshift.calledOnce);
      scope.saveAddress();
      assert.isTrue(scope.userBlob.unshift.calledOnce);
      done();
    });

    it("should set the addressSaving property to true", function (done) {
      assert.isFalse(scope.addressSaving);
      scope.saveAddress();
      assert.isTrue(scope.addressSaving);
      done();
    });
  });

  describe('updating the destination', function (done) {
    beforeEach(function () {
      scope.send.recipient_address = 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk';
    });

    it('should have a function to do so', function (done) {
      assert.isFunction(scope.update_destination);
      done();
    });

    describe('when the recipient is the same as last time', function (done) {
      beforeEach(function () {
        scope.send.last_recipient = scope.send.recipient_address;
      });

      it('should not reset destination dependencies', function (done) {
        var spy = sinon.spy(scope, 'reset_destination_deps');
        scope.update_destination();
        assert(spy.notCalled);
        done();
      });

      it('should not check destination tag visibility', function (done) {
        var spy = sinon.spy(scope, 'check_dt_visibility');
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
        var spy = sinon.spy(scope, 'reset_destination_deps');
        scope.update_destination();
        assert(spy.called);
        done();
      });

      it('should check destination tag visibility', function (done) {
        var spy = sinon.spy(scope, 'check_dt_visibility');
        scope.update_destination();
        assert(spy.called);
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

  });

 
});
