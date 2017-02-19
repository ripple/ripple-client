'use strict';
var protractor = require('protractor');
var ptor = protractor.getInstance();
var helper_routechange = require('./utils/browser')(ptor);
var config = require('../protractor.conf.js').config;
var baseUrl = config.baseUrl;
var timeout = 100000;

describe('Header Navigation - dropdown menu - Settings link', function(){

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

	it('Should change route to /security when user clicks Settings', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){

				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu'))
					.findElement(protractor.By.css('li:nth-child(3)')).click()
					.then(function(){
						helper_routechange.waitForNavigation('#/security');
						ptor.driver.getCurrentUrl()
							.then(function(url){
								expect(url).toEqual(baseUrl + '/security');
							});
					});
			});
	}, timeout);

	it('Should have a Settings icon', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings')).click()
			.then(function(){

				ptor.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings'))
					.findElement(protractor.By.className('dropdown-menu'))
					.findElement(protractor.By.css('li:nth-child(3)'))
					.findElement(protractor.By.tagName('i'))
					.then(function(element){
						expect(element.getAttribute('class')).toMatch(/icon-settings/);
					});
			});
	}, timeout);

});