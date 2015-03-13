'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('password setting', function() {

    // security page object
    var SecurityPage = function() {
      this.changePasswordButton = $('a[ng-hide="openFormPassword"][l10n]');
      this.passwordForm = $('#renameForm');
      this.passwordNotification = $('.alert.alert-success[ng-show=success.changePassword]');

      this.get = function() {
        browser.get('#/security');
        browser.wait($('.showSecurity').isDisplayed);
      };

      this.changePassword = function(oldpassword, newpassword) {
        $('input[name=password]').sendKeys(oldpassword);
        $('input[name=change_password1]').sendKeys(newpassword);
        $('input[name=change_password2]').sendKeys(newpassword);
        return $('#renameForm button[type=submit]').click();
      };
    };
    var securityPage = new SecurityPage();

    before(function(){
      helperForms.login(config.user.username, config.user.password);
    });

    it('should render the security page', function(done) {
      // Go to send page
      securityPage.get();

      // Wait for the security page to render
      expect(securityPage.changePasswordButton.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

    it('should render the password form', function(done) {
      securityPage.changePasswordButton.click();
      expect(securityPage.passwordForm.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

    var tempPassword = config.user.password + '-e2e';
    protractor.getInstance().ignoreSynchronization = true;

    it('should change the password', function(done) {
      securityPage.changePassword(config.user.password, tempPassword);
      expect(securityPage.passwordNotification.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

    it('should login with the new password', function(done) {
      helperForms.login(config.user.username, tempPassword);
    });

    it('should render the security page again', function(done) {
      // sleep for 2s
      browser.sleep(2000);
      // Wait for the security page to render
      securityPage.get();
      expect(securityPage.changePasswordButton.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

    it('should render the password form', function(done) {
      securityPage.changePasswordButton.click();
      expect(securityPage.passwordForm.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });

    it('should change the password back', function(done) {

      securityPage.changePassword(tempPassword, config.user.password);
      expect(securityPage.passwordNotification.isDisplayed())
        .to.eventually.be.true
        .and.notify(done);
    });
});
