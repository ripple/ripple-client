'use strict';
var protractor = require('protractor');
var ptor = protractor.getInstance();
var helper_routechange = require('./utils/browser')(ptor);
var config = require('../protractor.conf.js').config;
var baseUrl = config.baseUrl;
var timeout = 100000;

describe('Header Navigation - dropdown menu - Logout link', function(){

	beforeEach(function(){
		ptor.get('#/balance');
	});

	it('Should not have dropdown menu displayed when view first loads', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings'))
			.findElement(protractor.By.className('dropdown-menu')).isDisplayed()
			.then(function(displayed){
				expect(displayed).toEqual(false);
			});

	}, timeout);

	it('Should display dropdown menu when users clicks gear/settings icon', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){
				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu')).isDisplayed()
					.then(function(displayed){
						expect(displayed).toEqual(true);
					});
			});

	}, timeout);

	it('Should have a Logout icon', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){

				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu'))
					.findElement(protractor.By.css('li:nth-child(5)'))
					.findElement(protractor.By.tagName('i'))
					.then(function(element){
						expect(element.getAttribute('class')).toMatch(/icon-logout/);
					});
			});
	}, timeout);

	it('Should return user to the Login when Logout is clicked', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){

				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu'))
					.findElement(protractor.By.css('li:nth-child(5)')).click()
					.then(function(){
						helper_routechange.waitForNavigation('#/login');
						ptor.driver.getCurrentUrl()
							.then(function(url){
								expect(url).toEqual(baseUrl + '/login');
							});
					});
			});

	}, timeout);

});