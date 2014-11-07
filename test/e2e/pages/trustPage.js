'use strict';

var helperBrowser = require('../utils/browser');

var TrustPage = function () {
  this.connectGatewayButton = element(by.css('.btn-add-trust a'));
  this.gatewayAddressInput = element(by.css('#trust_counterparty'));
  this.trustFormSubmitButton = element(by.css("form[name='trustForm'] a.btn.btn-primary.submit"));
  this.currencyInput = element(by.css('form[name="trustForm"] div[ng-hide="advanced_feature_switch"] #trust_amount_currency'));
  this.confirmGatewayButton = element(by.css("div.modal-dialog button.btn-default.btn-success"));
  this.unlockPasswordInput = element(by.css("div.modal-dialog #popup_unlock_password"));
  this.unlockPasswordButton = element(by.css("div.modal-dialog div.unlock-btns-wrapper button.modal-submit-btn"));
  this.gatewayAddedHolder = element(by.css('group.result-success[ng-show=\'tx_result=="cleared"\'] h2'));
//  this.usdGatewayTitle = element(by.css('div.currency-usd span.currency')).getText();
  this.usdGatewayEditButton = element(by.css('div.currency-usd div.lines a[ng-click="edit_account()"]'));
  this.usdGatewayDeleteButton = element(by.css('div.currency-usd div.lines span[ng-show="editing && !advanced_feature_switch"] button[ng-click="delete_account()"]'));
  this.gatewayRemovedHolder = element(by.css('group[on="notif"] group.result-success[ng-switch-when="gateway_removed"]'));

  // for gateway advanced test
  this.gatewayTrustAmountInput = element(by.css('#trust_amount'));
  this.advancedCurrencyInput = element(by.css('form[name="trustForm"] div[ng-show="advanced_feature_switch"] #trust_amount_currency'));
  //  editLimitInput =  element(by.model('trust.limit'));
  this.editLimitInput = element(by.css('div.currency-usd input[name="limit"]'));
  this.usdGatewaySaveButton = element(by.css('div.currency-usd div.lines div[ng-show="editing && advanced_feature_switch"] #save'));
  this.changesSavedHolder = element(by.css('group[on="notif"] group.result-success[ng-switch-when="success"]'));
  // exactBinding not working - protractor is too old :(
  // usdGatewayLimitHolder =  element(by.css('div.currency-usd div.lines ')).element(by.exactBinding('component.limit'));
  this.usdGatewayLimitHolder = element(by.css('div.currency-usd div.lines div[ng-show="advanced_feature_switch"] div.ng-binding'));
  this.usdGatewayAdvancedDeleteButton = element(by.css('div.currency-usd div.lines div[ng-show="editing && advanced_feature_switch"] button[ng-click="delete_account()"]'));
};

Object.defineProperty(TrustPage.prototype, 'usdGatewayTitle', {
    get: function() {
        return ($('div.currency-usd span.currency')).getText();
    }
});

TrustPage.prototype.goTo = function () { 
  browser.get('#/trust'); 
}
  
TrustPage.prototype.gatewayTitle = function (currency) {
  return $('div.currency-' + currency.toLowerCase() + ' span.currency').getText();
}

TrustPage.prototype.putAddress = function (address, currency) {
  var self = this;
  return  this.gatewayAddressInput.sendKeys(address).
            then(this.currencyInput.clear).
            then(function() {
              return self.currencyInput.sendKeys(currency);
            });
}

TrustPage.prototype.connectGateway = function (addressOrName, currency, password) {
    return this.putAddress(addressOrName, currency).then(this.connectGatewaySubmit.bind(this, password));
}

TrustPage.prototype.connectGatewaySubmit = function (password) {
  var self = this;

  return helperBrowser.waitForElementToBecameAvailable(this.trustFormSubmitButton).
    then(this.trustFormSubmitButton.click).
    then(helperBrowser.waitForElementToDisplay.bind(self, this.confirmGatewayButton)).
    then(this.confirmGatewayButton.click).
    then(browser.sleep.bind(self, 1000)).
    then(function() {
      return self.unlockPasswordInput.isPresent();
    }).
    then(function(isUnlockDisplayed) {
      /// it should show password input
      if (isUnlockDisplayed) {
        return self.unlockPasswordInput.sendKeys(password).then(function() {
          protractor.getInstance().ignoreSynchronization = true;
          return self.unlockPasswordButton.click();
        });
      } else {
        return protractor.promise.fulfilled(true);
      }
    }).
    then(helperBrowser.waitForElementToDisplay.bind(self, this.gatewayAddedHolder));
}

TrustPage.prototype.removeGateway = function (currency) {
  var self = this;
  return $('div.currency-' + currency.toLowerCase() + ' div.lines a[ng-click="edit_account()"]').click().
    then(browser.sleep.bind(this, 30)).
    then($('div.currency-' + currency.toLowerCase() + ' div.lines span[ng-show="editing && !advanced_feature_switch"] button[ng-click="delete_account()"]').click).
    then(helperBrowser.waitForElement.bind(self, self.gatewayRemovedHolder)).
    then(browser.sleep.bind(this, 1000));
}


// for gateway advanced test
TrustPage.prototype.putAddressAdvanced = function (address, currency, amount) {
  var self = this;
  return  this.gatewayAddressInput.sendKeys(address).
            then(this.advancedCurrencyInput.clear).
            then(function () {
              self.advancedCurrencyInput.sendKeys(currency);
            }).
            then(this.gatewayTrustAmountInput.clear).
            then(function () {
              self.gatewayTrustAmountInput.sendKeys(amount);
            });
}

module.exports = TrustPage;
