var protractor = require('protractor');
var helpers = require('./browser');

/*
 add these 2 lines to the top of your it block to force a logout and log back in
 - forms.logout();
 - forms.login(config.user.username,config.user.password);
 */

exports.login = function (username,password) {
	browser.get('#/login');
	browser.getCurrentUrl()
		.then(function(url){
			// It's already logged in if the page is other then login or register
			if (url.match('login') || url.match('register')){
				browser.get('#/login');

				$(".auth-form-container #login_username").sendKeys(username);
				$(".auth-form-container #login_password").sendKeys(password);
				$(".auth-form-container .submit-btn-container button").click()
					.then(function(){
						helpers.waitForNavigation('#/balance');
					})
			}
		})
};

exports.migrate = function (username,password) {
	browser.get('#/migrate');

	$(".auth-form-container #login_username").sendKeys(username);
	$(".auth-form-container #login_password").sendKeys(password);
	$(".auth-form-container .submit-btn-container button").click()
		.then(function(){
			helpers.waitForNavigation('#/register');
		})
};

// TODO refactor to use jQuery like selectors
exports.logout = function () {
	browser.getCurrentUrl()
		.then(function(url){
			if (!url.match('login')){
				browser.findElement(protractor.By.className('mainnav'))
					.findElement(protractor.By.className('settings')).click()
					.then(function(){

						browser.findElement(protractor.By.className('mainnav'))
							.findElement(protractor.By.className('settings'))
							.findElement(protractor.By.className('dropdown-menu'))
							.findElement(protractor.By.css('li:nth-child(5)')).click()
							.then(function(){
								helpers.waitForNavigation('#/login');
							});
					});
			} else {
				browser.get('#/login');
			}

		});
};
