'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('ripple client', function() {
  var ptor;

  beforeEach(function() {
    ptor = protractor.getInstance();
  });

  describe('bootstrap', function() {

    beforeEach(function() {
      ptor.get('#');
    });

    it('should automatically redirect to /register when location hash/fragment is empty', function() {
      ptor.getCurrentUrl()
        .then(function(url) {
          expect(url).to.contain('/register');
        });
    });

  });

  describe('login', function() {

    beforeEach(function() {
      ptor.get('#/login');
    });

    it('should render login when user navigates to /login', function() {
      expect($("form[name='loginForm']").getText()).to.exist;
    });

    it('should login the test user', function() {
      // Fill the form
      $(".auth-form-wrapper #login_username").sendKeys(config.username);
      $(".auth-form-wrapper #login_password").sendKeys(config.password);
      $(".auth-form-wrapper button").click();

      // Check if it takes to the balance page (success login)
      ptor.getCurrentUrl()
        .then(function(url) {
          expect(url).to.contain('/balance');
        });
    });

  });
});
