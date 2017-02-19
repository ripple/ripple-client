'use strict';
var protractor = require('protractor');
var ptor = protractor.getInstance();
var helper_forms = require('./utils/forms')(ptor);
var config = require('../protractor.conf.js').config;
var baseUrl = config.baseUrl;
var timeout = 100000;

describe('Login', function(){

	it('Should login a user then change route to /balance', function(){

		helper_forms.login(config.user.username,config.user.password);

		ptor.driver.getCurrentUrl()
			.then(function(url){
				expect(url).toEqual(baseUrl + '/balance');
			});

	}, timeout);

	it('Should not have dropdown menu displayed when view first loads', function(){

		ptor.findElement(protractor.By.className('mainnav'))
			.findElement(protractor.By.className('settings'))
			.findElement(protractor.By.className('dropdown-menu')).isDisplayed()
			.then(function(displayed){
				expect(displayed).toEqual(false);
			});

	}, timeout);
});