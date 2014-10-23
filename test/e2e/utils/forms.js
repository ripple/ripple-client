var protractor = require('protractor');
var helpers;
module.exports = function(ptor) {
	helpers = require('./browser')(ptor);

	function login(username,password) {

		/*
		 add these 2 lines to the top of your it block to force a logout and log back in
		 - forms.logout();
		 - forms.login(config.user.username,config.user.password);

		*/

		browser.get('#/login');

		ptor.findElement(protractor.By.className('auth-form-wrapper'))
			.findElement(protractor.By.id('login_username')).sendKeys(username)
		ptor.findElement(protractor.By.className('auth-form-wrapper'))
			.findElement(protractor.By.id('login_password')).sendKeys(password)
		ptor.findElement(protractor.By.className('auth-form-wrapper'))
			.findElement(protractor.By.className('submit-btn-container')).click()
			.then(function(){
				helpers.waitForNavigation('#/balance');
			})
	}

	function logout(){
		ptor.driver.getCurrentUrl()
			.then(function(url){
				if (!url.match('login')){
					ptor.findElement(protractor.By.className('mainnav'))
						.findElement(protractor.By.className('settings')).click()
						.then(function(){

							ptor.findElement(protractor.By.className('mainnav'))
								.findElement(protractor.By.className('settings'))
								.findElement(protractor.By.className('dropdown-menu'))
								.findElement(protractor.By.css('li:nth-child(5)')).click()
								.then(function(){
									helpers.waitForNavigation('#/login');
								});
						});
				}else{
					browser.get('#/login');
				}

			});
	}
	return {
		login: login,
		logout: logout
	};
};