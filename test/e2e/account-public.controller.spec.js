'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');
var helperBrowser = require('./utils/browser');


chai.use(chaiAsPromised);
var expect = chai.expect;


describe('public account', function() {

  before(function(){
    helperForms.login(config.user.username,config.user.password);
  });


  function pressRenameSubmit() {
    return $("form[name='renameForm'] button[type='submit']")
      .click().then(
        helperBrowser.waitForElementToDisplay.bind(this, $("div.showPublic div.alert-success"))
      );
  }

  function waitForRenameSubmitButtonBecameAvailable() {
    return helperBrowser.waitForElementToBecameAvailable($("form[name='renameForm'] button[type='submit']"));
  }

  it('should show public account page', function(done) {
    browser.get('#/account/public');

    // Wait for the page to render
    helperBrowser.waitForElementToDisplay($('#address'));

    expect($('.username').getText()).to.eventually.equal('~' + config.user.username)
      .and.notify(done);
  });

  it('should show rename user controls', function(done) {
    $('div.edit-account-btn-wrapper a').click();

    expect($('#renameForm').isDisplayed())
      .to.eventually.be.true;

    expect($('#address').isDisplayed())
      .to.eventually.be.true
      .and.notify(done);
  });


  it('should allow to rename user', function(done) {
    $('#username').sendKeys(config.user.username + '-E2E');
    $('#password').sendKeys(config.user.password);
    
    waitForRenameSubmitButtonBecameAvailable();

    expect($("form[name='renameForm'] button[type='submit']").getAttribute('disabled'))
      .to.eventually.be.null
      .and.notify(done);
  });


  it('should rename user', function(done) {
    protractor.getInstance().ignoreSynchronization = true;

    pressRenameSubmit();

    expect($('.username').getText()).to.eventually.equal('~' + config.user.username + '-E2E')
        .and.notify(done);
  });

  it('should rename user back', function(done) {
    $('div.edit-account-btn-wrapper a').click();

    $('#username').sendKeys(config.user.username);
    $('#password').sendKeys(config.user.password);

    waitForRenameSubmitButtonBecameAvailable();

    pressRenameSubmit();

    expect($('.username').getText()).to.eventually.equal('~' + config.user.username)
      .and.notify(done);
  });

});
