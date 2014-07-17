'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

chai.use(chaiAsPromised);
var expect = chai.expect;

// For some weird reason config ignores allScriptsTimeout
browser.manage().timeouts().setScriptTimeout(20000);

describe('send', function() {

  before(function(){
    // Open the client
    browser.get('#');

    // Login the user
    browser.executeScript('store.set("ripple_auth",{' +
      'username: "' + config.user.username + '", ' +
      'keys: {' +
      '"id":"' + config.user.keys.id + '",' +
      '"crypt":"' + config.user.keys.crypt + '"' +
      '}, ' +
      'url: "' + config.user.url + '"})'
    );

    browser.navigate().refresh();
  });

  it('should render the send page', function(done) {
    // Go to send page
    browser.get('#/send');

    // Wait for the send form to render
    browser.wait(function() {
      return $('#sendForm').isDisplayed().then(function(result) {
        return result;
      });
    });

    // Assuming that everything's ok if the #send_destination is present
    expect($('#send_destination').isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  describe('recipient', function() {

    var input = $('#send_destination');

    beforeEach(function(){
      input.clear();
    });

    it('should not accept an invalid ripple address', function(done) {
      input.sendKeys('invalidrippleaddress');
      expect(input.getAttribute('class'))
        .to.eventually.contain('ng-invalid')
        .and.notify(done);
    });

    it('should accept a valid ripple address', function(done) {
      input.sendKeys(config.counterparty);
      expect(input.getAttribute('class'))
        .to.eventually.not.contain('ng-invalid')
        .and.notify(done);
    });

    // TODO should accept a contact name
    // TODO should accept a ripple name

  });

  describe('amount', function() {

    var input = $('#send_amount');

    beforeEach(function(){
      input.clear();
    });

    it('should not accept an invalid amount', function(done) {
      input.sendKeys('123a');
      expect(input.getAttribute('class'))
        .to.eventually.contain('ng-invalid')
        .and.notify(done);
    });

    it('should accept a valid amount', function(done) {
      input.sendKeys('0.000001');
      expect(input.getAttribute('class'))
        .to.eventually.not.contain('ng-invalid')
        .and.notify(done);
    });

  });

  // TODO test destination tag
  // TODO test source tag

  describe('send xrp button', function() {

    var input = $('#sendXrpButton');

    it('should be active', function(done) {
      expect(input.getAttribute('disabled'))
        .to.eventually.not.equal('disabled')
        .and.notify(done);
    });

    it('should take to the confirmation screen', function(done) {
      input.click();
      expect($('.mode-confirm').isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

  });

  // TODO test alternate payments (with pathfinding)

  describe('confirm', function() {

    // TODO test the wrong password case

    it('button click should confirm the transaction', function(done) {
      $('#send_unlock_password').sendKeys(config.user.password);
      $('#confirmButton').click();

      browser.wait(function() {
        return $('.mode-status').isDisplayed().then(function(result) {
          return result;
        });
      });

      expect($('.mode-status .pending').isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

    it('should succeed', function(done) {
      browser.wait(function() {
        return $('.mode-status .pending').isDisplayed().then(function(result) {
          return !result;
        });
      });

      expect($('.mode-status .result-success').isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

  });

});