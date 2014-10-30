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
