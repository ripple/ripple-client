'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');
var helperBrowser = require('./utils/browser');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('register form', function() {

  beforeEach(function(){
    browser.get('#/register');
  });

  it('should render the register form', function(done) {
    expect($("form[name='registerForm']").getText())
      .to.exist
      .and.notify(done);
  });
});

describe('user name field', function() {

  beforeEach(function(){
    browser.get('#/register');
  });

  it('should accept a non-existing user name', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys(config.user.username + "-new")
      .then(function(){
        var message = $("form[name='registerForm'] .success[rp-error-valid]");
        helperBrowser.waitForElement(message);
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny an existing user name', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys(config.user.username)
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='exists']");
        helperBrowser.waitForElement(message);
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a reserved user name', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys("google")
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='reserved']");
        helperBrowser.waitForElement(message);
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a too short user name', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys("xy")
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='tooshort']");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a user name with a wrong charset', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys(config.user.username + "ä")
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='charset']");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a user name starting with a hyphen', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys("-" + config.user.username)
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='starthyphen']");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a user name ending with a hyphen', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys(config.user.username + "-")
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='endhyphen']");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a user name with multiple hyphens', function(done) {
    $(".auth-form-wrapper #register_username")
      .sendKeys(config.user.username + "--x")
      .then(function(){
        var message = $("form[name='registerForm'] .errorGroup[rp-errors='register_username'] span[ng-switch-when='multhyphen']");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });
});

describe('password field', function() {

  beforeEach(function(){
    browser.get('#/register');
  });

  it('should deny a weak password', function(done) {
    $(".auth-form-wrapper #register_password")
      .sendKeys("123456")
      .then(function(){
        var message = $(".ng-invalid-rp-strong-password#register_password");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should accept a strong password', function(done) {
    $(".auth-form-wrapper #register_password")
      .sendKeys("73571n6.")
      .then(function(){
        var message = $(".ng-valid-rp-strong-password#register_password");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny non-matching passwords', function(done) {
    $(".auth-form-wrapper #register_password").sendKeys("73571n6.");
    $(".auth-form-wrapper #register_password2").sendKeys("73571n6")
      .then(function(){
        var message = $(".ng-invalid-rp-same-in-set#register_password");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should accept matching passwords', function(done) {
    $(".auth-form-wrapper #register_password").sendKeys("73571n6.");
    $(".auth-form-wrapper #register_password2").sendKeys("73571n6.")
      .then(function(){
        var message = $(".ng-valid-rp-same-in-set#register_password");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });
});

describe('email field', function() {

  beforeEach(function(){
    browser.get('#/register');
  });

  it('should deny an invalid email', function(done) {
    $(".auth-form-wrapper #register_email").sendKeys("e2e-test")
      .then(function(){
        var message = $(".ng-invalid-email#register_email");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should accept a valid email', function(done) {
    $(".auth-form-wrapper #register_email").sendKeys("e2e-test+index@example.com")
      .then(function(){
        var message = $(".ng-valid-email#register_email");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });
});

describe('secret field', function() {

  beforeEach(function(){
    browser.get('#/register');
  });

  it('should deny an invalid secret', function(done) {
    $(".auth-form-wrapper a[ng-click='showMasterKeyInput=true']").click();
    $(".auth-form-wrapper #register_masterkey").sendKeys("test-invalid-key")
      .then(function(){
        var message = $(".ng-invalid-rp-master-key#register_masterkey");
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should accept a valid secret', function(done) {
    $(".auth-form-wrapper a[ng-click='showMasterKeyInput=true']").click();
    $(".auth-form-wrapper #register_masterkey").sendKeys(config.oldUser.secret)
      .then(function(){
        var message = $(".ng-valid-rp-master-key#register_masterkey");
        expect(message.isPresent())
          .to.eventually.be.true;
        message = $(".ng-valid-rp-master-address-exists#register_masterkey");
        helperBrowser.waitForElement(message);
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });

  it('should deny a valid secret that already has an account', function(done) {
    $(".auth-form-wrapper a[ng-click='showMasterKeyInput=true']").click();
    $(".auth-form-wrapper #register_masterkey").sendKeys(config.user.secret)
      .then(function(){
        var message = $(".register_masterkey .auth-attention:not(.ng-hide)");
        helperBrowser.waitForElement(message);
        expect(message.isPresent())
          .to.eventually.be.true
          .and.notify(done);
      });
  });
});

describe('register button', function() {

  var username = "e2e-test-reg-" + Math.floor(Math.random() * 1000000);

  before(function(){
    browser.get('#/register');
    $(".auth-form-wrapper #register_username").sendKeys(username);
    $(".auth-form-wrapper #register_password").sendKeys(config.user.password);
    $(".auth-form-wrapper #register_password2").sendKeys(config.user.password);
    $(".auth-form-wrapper #register_email").sendKeys("test@example.com");
    $(".auth-form-wrapper #terms").click()
      .then(function(){
        var message = $("form[name='registerForm'] .success[rp-error-valid]");
        helperBrowser.waitForElement(message);
      });
  });

  it('should be active', function(done) {
    expect($(".submit-btn-container button").getAttribute('disabled'))
      .to.eventually.not.equal('disabled')
      .and.notify(done);
  });

  it('click should register the user', function(done) {
    $(".submit-btn-container button").click()
    .then(function () {
      var message = $("form[name='resendForm']");
      helperBrowser.waitForElement(message);
      expect(message.isPresent())
        .to.eventually.be.true
        .and.notify(done);
    });
  });

});
