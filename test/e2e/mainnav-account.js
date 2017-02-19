'use strict';
var protractor = require('protractor');
var ptor = protractor.getInstance();
var helper_routechange = require('./utils/browser')(ptor);
var config = require('../protractor.conf.js').config;
var baseUrl = config.baseUrl;
var timeout = 100000;

describe('Header Navigation - dropdown menu - Account link', function(){

	beforeEach(function(){
		ptor.get('#/balance');
	});

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

	it('Should change route to /account when user clicks Settings', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){

				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu'))
					.findElement(protractor.By.css('li:nth-child(1)')).click()
					.then(function(){
						helper_routechange.waitForNavigation('#/account/public');
						ptor.driver.getCurrentUrl()
							.then(function(url){
								expect(url).toEqual(baseUrl + '/account/public');

							});
					});
			});

	}, timeout);

	it('Should have a Profile icon', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){

				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu'))
					.findElement(protractor.By.css('li:nth-child(1)'))
					.findElement(protractor.By.tagName('i'))
					.then(function(element){
						expect(element.getAttribute('class')).toMatch(/icon-profile/);
					});
			});
	}, timeout);

});