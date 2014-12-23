exports.waitForNavigation = function (part) {
  return browser.wait(function () {
    return browser.driver.getCurrentUrl().then(function (url) {
      return !!url.match(part);
    });
  });
};

exports.waitForElement = function (part) {
  return browser.wait(function () {
    return part.isPresent();
  });
};

exports.waitForElementToDisplay = function (part) {
  return browser.wait(function () {
    return part.isPresent();
  }).then(function() {
    return browser.wait(part.isDisplayed);
  });
};

exports.waitForElementToBecameAvailable = function (part) {
  return browser.wait(function () {
    return part.getAttribute('disabled').then(function (isDisabled) {
      return !isDisabled;
    });
  });
};

