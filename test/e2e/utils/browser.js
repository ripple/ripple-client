exports.waitForNavigation = function (part) {
  browser.wait(function () {
    return browser.driver.getCurrentUrl().then(function (url) {
      return !!url.match(part);
    });
  });
};
exports.waitForElement = function (part) {
  browser.wait(function () {
    return part.isPresent().then(function (isPresent) {
      return isPresent;
    });
  });
};

/**
 * This hack needed becasue Keychain sets functione with timeout  
 * for 300s, and while it's not completed, any call to browser.wait
 * will not succeed. With this hack we decrementing internal counter
 * in angular, so browser.wait will not wait.
 *
 */
exports.waitHack = function() {
    return browser.driver.executeAsyncScript(
    'var cb = arguments[arguments.length - 1]; ' +
    'window.setTimeout(' +
    'function() { ' +
    "  angular.element('body').injector().get('$browser').$$completeOutstandingRequest(function(){});" +
    '  cb(); ' +
    '}, 2000) ');
}
