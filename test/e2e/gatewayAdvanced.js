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

  var trustPage;
  var advancedPage;

  before(function(){
    helperForms.login(config.user.username,config.user.password);
    trustPage = new TrustPage();
    advancedPage = new AdvancedPage();
    advancedPage.goTo();
  });

  it('should show advanced settings page', function(done) {
    helperBrowser.waitForElementToDisplay(advancedPage.editAdvancedSettingsButton).then(done);
  });

  it('should show trust line advanced settings edit control', function(done) {
    advancedPage.editAdvancedSettingsButton.click().
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.showAdvancedOptionsInput)).
      then(done);
  });

  it('should save trust line advanced settings show on', function(done) {
    advancedPage.showAdvancedOptionsInput.click().
      then(advancedPage.saveAdvancedSettingsButton.click).
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.advancedSettingsShowHolder)).
      then(done);
  });

  it('should show gateways page', function(done) {
    trustPage.goTo();

    helperBrowser.waitForElementToDisplay(trustPage.connectGatewayButton).then(done);
  });

  it('should show add gateway user controls', function(done) {
    trustPage.connectGatewayButton.click();

    expect(trustPage.gatewayAddressInput.isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  it('should show trust amount input field', function(done) {
    expect(trustPage.gatewayTrustAmountInput.isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  it('should connect a gateway using Ripple address', function(done) {
    var self = this;
    trustPage.putAddressAdvanced(config.gateway.address, 'USD', "1000").
      then(trustPage.connectGatewaySubmit.bind(trustPage, config.user.password)).
      then(done);
  });

  it('should show gateway', function(done) {
    expect(trustPage.usdGatewayTitle).to.eventually.equal('USD - US Dollar')
      .and.notify(done);
  });

  it('should show edit limit input', function(done) {
    trustPage.usdGatewayEditButton.click().
      then(helperBrowser.waitForElementToDisplay.bind(this, trustPage.editLimitInput)).
      then(done);
  });

  it('should show new limit', function(done) {
    trustPage.editLimitInput.clear().
      then(function () { 
        trustPage.editLimitInput.sendKeys('200');
      }).
      then(function() {
        protractor.getInstance().ignoreSynchronization = true;
        return trustPage.usdGatewaySaveButton.click();
      }).then(helperBrowser.waitForElement.bind(this, trustPage.changesSavedHolder)).
      then(function() {
          expect(trustPage.usdGatewayLimitHolder.getText()).to.eventually.equal('200.00')
            .and.notify(done);
      });
  });

  it('should remove a gateway', function(done) {
    trustPage.usdGatewayEditButton.click().
      then(trustPage.usdGatewayAdvancedDeleteButton.click).
      then(helperBrowser.waitForElement.bind(this, trustPage.gatewayRemovedHolder)).
      then(function() {
        advancedPage.goTo();
        done();
      });
  });

  it('should show advanced settings page 2', function(done) {
    helperBrowser.waitForElementToDisplay(advancedPage.editAdvancedSettingsButton).then(done);
  });

  it('should show trust line advanced settings edit control 2', function(done) {
    advancedPage.editAdvancedSettingsButton.click().
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.showAdvancedOptionsInput)).
      then(done);
  });

  it('should save trust line advanced settings show off', function(done) {
    advancedPage.showAdvancedOptionsInput.click().
      then(advancedPage.saveAdvancedSettingsButton.click).
      then(helperBrowser.waitForElementToDisplay.bind(this, advancedPage.advancedSettingsHideHolder)).
      then(done);
  });

});
