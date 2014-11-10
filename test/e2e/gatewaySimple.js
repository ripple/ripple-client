'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');
var helperBrowser = require('./utils/browser');
var TrustPage = require('./pages/trustPage.js');


chai.use(chaiAsPromised);
var expect = chai.expect;

describe('gateway simple', function() {

  var page;

  before(function(){
    helperForms.login(config.user.username,config.user.password);
    page = new TrustPage();
    page.goTo();
  });

  it('should show gateways page', function(done) {
    helperBrowser.waitForElementToDisplay(page.connectGatewayButton).then(done);
    // hack. check if trust line advanced settings is on - than gatewayAdvanced 
    // $('#trust_counterparty').evaluate('advanced_feature_switch').then(function(on) {
    //   if (on) {
    //     $('#trust_counterparty').evaluate('advanced_feature_switch = true;');
    //   }
    // });
  });

  it('should show add gateway user controls', function(done) {
    page.connectGatewayButton.click();

    // $('#trust_counterparty').evaluate('advanced_feature_switch').then(function(r) { });
    expect(page.gatewayAddressInput.isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  it('should connect a gateway using Ripple address', function(done) {
    page.connectGateway(config.gateway.address, 'USD', config.user.password).then(done);
  });

  it('should show gateway', function(done) {
    // protractor.getInstance().ignoreSynchronization = false;
    expect(page.usdGatewayTitle).to.eventually.equal('USD - US Dollar')
      .and.notify(done);
  });

  it('should remove a gateway', function(done) {
    page.removeGateway('USD').then(done);
  });

  it('should show add gateway user controls (by name)', function(done) {
    page.connectGatewayButton.click();

    expect(page.gatewayAddressInput.isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });

  it('should connect a gateway using Ripple name', function(done) {
    page.connectGateway(config.gateway.name, 'USD', config.user.password).then(done);
  });

  it('should show USD gateway', function(done) {
    expect(page.usdGatewayTitle).to.eventually.equal('USD - US Dollar')
      .and.notify(done);
  });

  it('should remove a USD gateway', function(done) {
    page.removeGateway('USD').then(done);
  });

  it('should show add gateway user controls (fake currency)', function(done) {
    page.connectGatewayButton.click().then(function() {
      expect(page.gatewayAddressInput.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });
  });

  it('should connect a gateway with fake currency', function(done) {
    page.connectGateway(config.gateway.address, config.gateway.fakeCurrency, config.user.password).then(done);
  });

  it('should show gateway with fake currency', function(done) {
    expect(page.gatewayTitle(config.gateway.fakeCurrency)).to.eventually.equal(config.gateway.fakeCurrency)
      .and.notify(done);
  });

  it('should remove a fake currency gateway', function(done) {
    page.removeGateway(config.gateway.fakeCurrency).then(done);
  });

});
