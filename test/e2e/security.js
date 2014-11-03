'use strict';

// Chai is a BDD / TDD assertion library
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;

var helperForms = require('./utils/forms');

chai.use(chaiAsPromised);
var expect = chai.expect;

// For some weird reason config ignores allScriptsTimeout
// I don't think so. TODO: This can be proven by printing
// out config parameters
browser.manage().timeouts().setScriptTimeout(20000);

describe('password setting', function() {

    function changePassword(oldpassword, newpassword) {
        $('input[name=password]').sendKeys(oldpassword);
        $('input[name=change_password1]').sendKeys(newpassword);
        $('input[name=change_password2]').sendKeys(newpassword);
        return $('#renameForm button[type=submit]').click();
    }

    before(function(){
        helperForms.login(config.user.username, config.user.password);
    });

    it('should render the security page', function(done) {
        // Go to send page
        browser.get('#/security');

        // Wait for the security page to render
        browser.wait($('.showSecurity').isDisplayed);
        expect($('a[ng-hide=openFormPassword]').isDisplayed())
          .to.eventually.be.true
          .and.notify(done);
    });

    it('should render the password form', function(done) {
        $('a[ng-hide=openFormPassword]').click();
        expect($('#renameForm').isDisplayed())
          .to.eventually.be.true
          .and.notify(done);
    });

    var tempPassword = config.user.password + '-e2e';
    //browser.ignoreSynchronization = true;

    it('should change the password', function(done) {
        changePassword(config.user.password, tempPassword);
        expect($('[ng-show=success].alert.alert-success').isDisplayed())
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
        browser.get('#/security');
        browser.wait($('.showSecurity').isDisplayed);
        expect($('a[ng-hide=openFormPassword]').isDisplayed())
          .to.eventually.be.true
          .and.notify(done);
    });

    it('should render the password form', function(done) {
        $('a[ng-hide=openFormPassword]').click();
        expect($('#renameForm').isDisplayed()).to.eventually.be.true.and.notify(done);
    });

    it('should change the password back', function(done) {

        changePassword(tempPassword, config.user.password);
        expect($('[ng-show=success].alert.alert-success').isDisplayed())
          .to.eventually.be.true
          .and.notify(done);
    });

});
