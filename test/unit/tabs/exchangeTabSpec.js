'use strict';

describe('ExchangeCtrl', function() {
  var scope, dependencies, ctrl, network;

  beforeEach(module("rp"));
  beforeEach(inject(function ($rootScope, $controller, rpNetwork) {
    scope = $rootScope.$new();
    network = rpNetwork;

    scope.currencies_all = [
      { name: 'Ripples', value: 'XRP'},
      { name: 'US Dollar', value: 'USD'}
    ];

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


    ctrl = $controller("ExchangeCtrl", dependencies);
  }));

  it('should be initialized with defaults', function (done) {
    assert.isObject(scope.xrp);
    assert.strictEqual(scope.xrp.name, 'XRP - Ripples');
    assert.strictEqual(scope.xrp.code, 'XRP');
    assert.isObject(scope.xrp.currency);
    done();
  });

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

    assert.strictEqual(scope.currency_choices[0], 'XRP - Ripples');

    done();
  });

  it('should update paths after entering 2 as amount for XRP', function(done) {

    scope.exchange.amount = "2";
    var spy = sinon.spy(scope, 'reset_paths');
    scope.$apply();

    assert(spy.called);
    assert.strictEqual(scope.exchange.alternatives.length, 0);
    assert.strictEqual(scope.exchange.amount_feedback.to_text_full(), "2/XRP");

    done();
  });

  it('should update paths after changing currency choice', function(done) {

    var spy = sinon.spy(scope, 'update_exchange');
    scope.exchange.currency_name = "USD";

    scope.$apply();

    assert(spy.called);

    assert.isObject(scope.exchange.currency_obj);
    assert.strictEqual(scope.exchange.currency_code, 'USD');
    assert.strictEqual(scope.exchange.currency_name, 'USD - US Dollar');

    assert.strictEqual(scope.exchange.path_status, 'waiting');

    done();
  });


  it('should update paths after entering 2 as amount for XRP', function(done) {

    scope.exchange.amount = "0.001";
    scope.exchange.currency_name = "USD";
    var spy = sinon.spy(scope, 'reset_paths');
    scope.$apply();

    assert(spy.called);
    assert.strictEqual(scope.exchange.alternatives.length, 0);
    assert.strictEqual(scope.exchange.amount_feedback.to_text_full(), "0.001/USD/r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk");

    done();
  });



});