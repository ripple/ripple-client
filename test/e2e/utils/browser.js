exports.waitForNavigation = function (part) {
  browser.wait(function () {
    return browser.driver.getCurrentUrl().then(function (url) {
      return !!url.match(part);
    });
  });
}