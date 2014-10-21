module.exports = function(ptor) {
    var helpers = require('./browser')(ptor);
    function login(username,password,part) {
        browser.get('#/login');
        ptor.findElement(protractor.By.className('auth-form-wrapper'))
            .findElement(protractor.By.id('login_username')).sendKeys(username)
        ptor.findElement(protractor.By.className('auth-form-wrapper'))
            .findElement(protractor.By.id('login_password')).sendKeys(password)
        ptor.findElement(protractor.By.className('auth-form-wrapper'))
            .findElement(protractor.By.className('submit-btn-container')).click()
            .then(function(){
                helpers.waitForNavigation(part);
            })
    }
    return {
        login: login
    };
};