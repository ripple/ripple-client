'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');
var helperBrowser = require('./utils/browser');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('bootstrap', function() {
  before(function() {
    browser.get('/#');
  });

  it('should automatically redirect to /register when location hash/fragment is empty', function(done) {
    helperBrowser.waitForNavigation('/#');
    expect(browser.getCurrentUrl())
      .to.eventually
      .contain('/register')
      .and.notify(done);
  });
});

describe('migration', function() {

  before(function(){
    browser.get('#/migrate');
  });

  it('should render migrate when user navigates to /migrate', function(done) {
    expect($("form[name='loginForm']").getText())
      .to.exist
      .and.notify(done);
  });

  it('should take old user to registration page', function(done) {
    helperForms.migrate(config.oldUser.username,config.oldUser.password);

    // Check if it takes to the register page
    expect(browser.getCurrentUrl())
      .to.eventually
      .contain('/register')
      .and.notify(done);
  });

});

describe('login', function() {

  before(function(){
    browser.get('#/login');
  });

  it('should render login when user navigates to /login', function(done) {
    expect($("form[name='loginForm']").getText())
      .to.exist
      .and.notify(done);
  });

  it('should login a user then change route to /balance', function(done) {
    helperForms.login(config.user.username,config.user.password);

    // Check if it takes to the balance page (success login)
    expect(browser.getCurrentUrl())
      .to.eventually
      .contain('/balance')
      .and.notify(done);
  });

  it('should not login a user with wrong password', function(done) {
    helperForms.logout();
    browser.get('#/login');
    browser.getCurrentUrl()
      .then(function(url){
        // It's already logged in if the page is other then login or register
        if (url.match('login') || url.match('register')){
          browser.get('#/login');

          $(".auth-form-container #login_username").sendKeys(config.user.username);
          $(".auth-form-container #login_password").sendKeys("wrongpassword");
          $("#loginBtn").click()
            .then(function(){
              var errorMessage = $("form[name='loginForm'] .text-status .backend b");
              helperBrowser.waitForElement(errorMessage);
              expect(errorMessage.isPresent())
                .to.eventually.be.true
                .and.notify(done);
            });
        }
      });
  });

});
