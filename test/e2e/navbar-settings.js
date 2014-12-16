'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var config = require('./protractor.conf.js').config;
var helpers = require('./utils/forms');
chai.use(chaiAsPromised);
var expect = chai.expect;

browser.manage().timeouts().setScriptTimeout(20000);

describe('Header Navigation - dropdown menu', function() {
    helpers.login(config.user.username, config.user.password);
	beforeEach(function(){
		browser.get('#/balance');
	});

	it('should display dropdown menu when users clicks gear/settings icon', function(){

		$('.mainnav .settings').click()
			.then(function(){
				expect($('.mainnav .settings .dropdown-menu').isDisplayed()).to.eventually.be.true;
			});
	});

	it('should change route to /security when user clicks Settings link', function(done){

		$('.mainnav .settings').click()
			.then(function(){
				$('.mainnav .settings .dropdown-menu a.security').click()
				.then(function(){
						expect(browser.getCurrentUrl()).to.eventually.contain('/security').and.notify(done);
				});
			});
	});

	it('should change route to /account/public when user clicks Account link', function(done){

		$('.mainnav .settings').click()
			.then(function(){
				$('.mainnav .settings .dropdown-menu a.account').click()
					.then(function(){
						expect(browser.getCurrentUrl()).to.eventually.contain('/account/public').and.notify(done);
					});
			});
	});

	it('should change route to /login when user clicks LogOut link', function(done){

		$('.mainnav .settings').click()
			.then(function(){
				$('.mainnav .settings .dropdown-menu a.logout').click()
					.then(function(){
						expect(browser.getCurrentUrl()).to.eventually.contain('/login').and.notify(done);
					});
			});
	});
});