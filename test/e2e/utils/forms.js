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
				$("#loginBtn").click()
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

exports.logout = function () {
	browser.getCurrentUrl()
		.then(function(url){
			if (!url.match('login')){
				$(".mainnav .settings").click()
					.then(function(){
						$(".mainnav .settings .dropdown-menu .logout").click()
							.then(function(){
								helpers.waitForNavigation('#/login');
							})
					})
			} else {
				browser.get('#/login');
			}
		});
};
