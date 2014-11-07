'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');
var helperBrowser = require('./utils/browser');
var TrustPage = require('./pages/trustPage.js');
var AdvancedPage = require('./pages/advancedPage.js');


chai.use(chaiAsPromised);
var expect = chai.expect;

describe('gateway advanced', function() {

  var page;
  var advancedPage;

  before(function(){
    helperForms.login(config.user.username,config.user.password);
    page = new TrustPage();
    advancedPage = new AdvancedPage();
    advancedPage.goTo();
  });

  it('should show advanced settings page', function(done) {
    helperBrowser.waitForElementToDisplay(advancedPage.editAdvancedSettingsButton).then(function() { done(); });
  });

  it('should show trust line advanced settings edit control', function(done) {
    advancedPage.editAdvancedSettingsButton.click().
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.showAdvancedOptionsInput)).
      then(function() { done(); });
  });

  it('should save trust line advanced settings show on', function(done) {
    advancedPage.showAdvancedOptionsInput.click().
      then(advancedPage.saveAdvancedSettingsButton.click).
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.advancedSettingsShowHolder)).
      then(function() { done(); });
  });

  it('should show gateways page', function(done) {
    page.goTo();

    helperBrowser.waitForElementToDisplay(page.connectGatewayButton).then(function() { done(); });
  });

  it('should show add gateway user controls', function(done) {
    page.connectGatewayButton.click();

    expect(page.gatewayAddressInput.isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  it('should show trust amount input field', function(done) {
    expect(page.gatewayTrustAmountInput.isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  it('should connect a gateway using Ripple address', function(done) {
    var self = this;
    page.putAddressAdvanced(config.gateway.address, 'USD', "1000").
      then(page.connectGatewaySubmit.bind(page, config.user.password)).
      then(function() { done(); });
  });

  it('should show gateway', function(done) {
    expect(page.usdGatewayTitle).to.eventually.equal('USD - US Dollar')
      .and.notify(done);
  });

  it('should show edit limit input', function(done) {
    page.usdGatewayEditButton.click().
      then(helperBrowser.waitForElementToDisplay.bind(this, page.editLimitInput)).
      then(function() { done(); });
  });

  it('should show new limit', function(done) {
    page.editLimitInput.clear().
      then(function () { 
        page.editLimitInput.sendKeys('200');
      }).
      then(function() {
        protractor.getInstance().ignoreSynchronization = true;
        return page.usdGatewaySaveButton.click();
      }).then(helperBrowser.waitForElement.bind(this, page.changesSavedHolder)).
      then(function() {
          expect(page.usdGatewayLimitHolder.getText()).to.eventually.equal('200.00')
            .and.notify(done);
      });
  });

  it('should remove a gateway', function(done) {
    page.usdGatewayEditButton.click().
      then(page.usdGatewayAdvancedDeleteButton.click).
      then(helperBrowser.waitForElement.bind(this, page.gatewayRemovedHolder)).
      then(function() {
        advancedPage.goTo();
        done();
      });
  });

  it('should show advanced settings page 2', function(done) {
    helperBrowser.waitForElementToDisplay(advancedPage.editAdvancedSettingsButton).then(function() { done(); });
  });

  it('should show trust line advanced settings edit control 2', function(done) {
    advancedPage.editAdvancedSettingsButton.click().
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.showAdvancedOptionsInput)).
      then(function() { done(); });
  });

  it('should save trust line advanced settings show off', function(done) {
    advancedPage.showAdvancedOptionsInput.click().
      then(advancedPage.saveAdvancedSettingsButton.click).
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.advancedSettingsHideHolder)).
      then(function() { done(); });
  });

});
