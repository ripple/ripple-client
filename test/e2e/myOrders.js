'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');
var helperBrowser = require('./utils/browser');
var TradePage = require('./pages/tradePage.js');


chai.use(chaiAsPromised);
var expect = chai.expect;

describe('My Orders', function() {

  var page;

  before(function(){
    helperForms.login(config.user.username,config.user.password);
    page = new TradePage();
    page.goTo();
  });

  it('should show trade page', function(done) {
    helperBrowser.waitForElement(page.myOrdersMsgHolder).then(done);
  });

  it('should set currency pair to XRP/USD.SnapSwap', function(done) {
    page.setCurrencyPair('XRP/USD.SnapSwap').then(function() {
      helperBrowser.waitForElement(page.sellXRPButton).then(done);
    });
  });

  it('should enable sell button', function(done) {
    page.enterOrder(0.0001, 987).then(function () {
      helperBrowser.waitForElementToBecameAvailable(page.sellXRPButton).then(done);
    });
  });

  it('should confirm fat finger', function(done) {
    page.sellXRPButton.click().then(function () {
      helperBrowser.waitForElementToBecameAvailable(page.confirmFatButton).then(done);
    });
  });

  it('should confirm show order', function(done) {
    page.confirmOrder(config.user.password).then(done);
  });

  it('should enable sell button 2', function(done) {
    page.enterOrder(0.0002, 907).then(function () {
      helperBrowser.waitForElementToBecameAvailable(page.sellXRPButton).then(done);
    });
  });

  it('should confirm fat finger 2', function(done) {
    page.sellXRPButton.click().then(function () {
      helperBrowser.waitForElementToBecameAvailable(page.confirmFatButton).then(done);
    });
  });

  it('should confirm show order 2', function(done) {
    page.confirmOrder(config.user.password).then(done);
  });

  it('should sort qty desc', function(done) {
    var self = this;
    page.qtyHead.click().
    then(browser.sleep.bind(this, 1000)).
    then(function () {
      page.qty.then(function(items) {
        expect(items.length).to.equal(2);
        expect(items[0].getText()).to.eventually.equal('0.0002');
      });
    });
  });

  it('should sort qty asc', function(done) {
    page.qtyHead.click().
    then(browser.sleep.bind(this, 1000)).
    then(function () {
      page.qty.then(function(items) {
        expect(items[0].getText()).to.eventually.equal('0.0001');
      });
    });
  });

  it('should sort limit desc', function(done) {
    page.limitHead.click().
    then(browser.sleep.bind(this, 1000)).
    then(function () {
      page.limit.then(function(items) {
        expect(items[0].getText()).to.eventually.equal('987');
      });
    });
  });

  it('should sort limit asc', function(done) {
    page.limitHead.click().
    then(browser.sleep.bind(this, 1000)).
    then(function () {
      page.limit.then(function(items) {
        expect(items[0].getText()).to.eventually.equal('907');
      });
    });
  });

  it('should set currency pair to XRP/USD.Bitstamp', function(done) {
    page.setCurrencyPair('XRP/USD.Bitstamp').then(function() {
      helperBrowser.waitForElement(page.sellXRPButton).then(done);
    });
  });

  it('should show current pairs only', function(done) {
    helperBrowser.waitForElementToDisplay(page.currentPairOnly).
    then(page.currentPairOnly.click).
    then(browser.sleep.bind(this, 100)).
    then(function() {
      page.qty.then(function(items) {
        expect(items.length).to.equal(0);
      });
    });
  });

  it('should show orders back', function(done) {
    helperBrowser.waitForElementToDisplay(page.currentPairOnly).
    then(page.currentPairOnly.click).
    then(browser.sleep.bind(this, 100)).
    then(function() {
      page.qty.then(function(items) {
        expect(items.length).to.equal(2);
      });
    });
  });

  it('should cancel all orders', function(done) {
      function checkCount() {
        page.limit.count().then(function(len) {
          if (len == 0) {
            done()
          } else {
            checkCount();
          }
        });
      }

      page.cancelAllOrders(config.user.password).
      then(browser.sleep.bind(this, 100)).
      then(function() {
        checkCount();
      });
  });
  
});
