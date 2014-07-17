'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

chai.use(chaiAsPromised);
var expect = chai.expect;

// For some weird reason config ignores allScriptsTimeout
browser.manage().timeouts().setScriptTimeout(20000);

var ptor = protractor.getInstance();

describe('bootstrap', function() {

  before(function() {
    ptor.get('#');

    // Remove session
    ptor.executeScript('store.set("ripple_auth")');
    ptor.navigate().refresh();
  });

  it('should automatically redirect to /register when location hash/fragment is empty', function(done) {
    expect(ptor.getCurrentUrl())
      .to.eventually.contain('/register')
      .and.notify(done);
  });

});

describe('login', function() {

  before(function(){
    ptor.get('#/login');
  });

  it('should render login when user navigates to /login', function(done) {
    expect($("form[name='loginForm']").getText()).to.exist.and.notify(done);
  });

  it('should login the test user', function(done) {
    // Fill the form
    $(".auth-form-wrapper #login_username").sendKeys(config.user.username);
    $(".auth-form-wrapper #login_password").sendKeys(config.user.password);
    $(".auth-form-wrapper button").click();

    // Check if it takes to the balance page (success login)
    expect(ptor.getCurrentUrl())
      .to.eventually.contain('/balance')
      .and.notify(done);
  });

});