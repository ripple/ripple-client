'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

chai.use(chaiAsPromised);
var expect = chai.expect;

// For some weird reason config ignores allScriptsTimeout
browser.manage().timeouts().setScriptTimeout(20000);



describe('bootstrap', function() {
  before(function() {
    browser.get('/#');
    // Remove session
    browser.executeScript('store.set("ripple_auth")');
    browser.navigate().refresh();
  });

  it('should automatically redirect to /register when location hash/fragment is empty', function(done) {
    expect(browser.getCurrentUrl())
      .to.eventually.contain('/register')
      .and.notify(done);
  });

});

describe('migration', function() {

  before(function(){
    browser.get('#/migrate');
  });

  it('should render migrate when user navigates to /migrate', function(done) {
    expect($("form[name='loginForm']").getText()).to.exist.and.notify(done);
  });

  it('should take old user to registration page', function(done) {
    // Fill the form
    $(".auth-form-container #login_username").sendKeys(config.oldUser.username);
    $(".auth-form-container #login_password").sendKeys(config.oldUser.password);
    $(".auth-form-container .submit-btn-container button").click();

    // Check if it takes to the register page

    // TODO not a good solution. The test will hang if it doesn't go as expected
    browser.wait(function() {
      return browser.getCurrentUrl().then(function(url) {
        if (/\/register/.test(url)) {
          done();
          return true;
        }
      });
    });
//    expect(browser.getCurrentUrl())
//      .to.eventually.contain('/register')
//      .and.notify(done);
  });

});

describe('login', function() {

  before(function(){
    browser.get('#/login');
  });

  it('should render login when user navigates to /login', function(done) {
    expect($("form[name='loginForm']").getText()).to.exist.and.notify(done);
  });

  it('should login the test user', function(done) {
    // Fill the form
    $(".auth-form-container #login_username").sendKeys(config.user.username);
    $(".auth-form-container #login_password").sendKeys(config.user.password);
    $(".auth-form-container .submit-btn-container button").click();

    // Check if it takes to the balance page (success login)
    expect(browser.getCurrentUrl())
      .to.eventually.contain('/balance')
      .and.notify(done);
  });

});
