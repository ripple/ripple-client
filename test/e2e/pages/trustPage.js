'use strict';

var helperBrowser = require('../utils/browser');

var TrustPage = function () {
};

TrustPage.prototype = Object.create({}, {
  goTo: { value: function () { browser.get('#/trust'); }},

  connectGatewayButton: { get: function () { return $('.btn-add-trust a'); }},
  gatewayAddressInput: { get: function () { return $('#trust_counterparty'); }},
  trustFormSubmitButton: { get: function () { return $("form[name='trustForm'] a.btn.btn-primary.submit"); }},
  currencyInput: { get: function () { return $('form[name="trustForm"] div[ng-hide="advanced_feature_switch"] #trust_amount_currency'); }},
  confirmGatewayButton: { get: function () { return $("div.modal-dialog button.btn-default.btn-success"); }},
  unlockPasswordInput: { get: function () { return $("div.modal-dialog #popup_unlock_password"); }},
  unlockPasswordButton: { get: function () { return $("div.modal-dialog div.unlock-btns-wrapper button.modal-submit-btn"); }},
  gatewayAddedHolder: { get: function () { return $('group.result-success h2'); }},
  usdGatewayTitle: { get: function () { return $('div.currency-usd span.currency').getText(); }},
  usdGatewayEditButton: { get: function () { return $('div.currency-usd div.lines a[ng-click="edit_account()"]'); }},
  usdGatewayDeleteButton: { get: function () { return $('div.currency-usd div.lines span[ng-show="editing && !advanced_feature_switch"] button[ng-click="delete_account()"]'); }},
  gatewayRemovedHolder: { get: function () { return $('group[on="notif"] group.result-success[ng-switch-when="gateway_removed"]'); }},
  
  gatewayTitle: { value: function (currency) {
    return $('div.currency-' + currency.toLowerCase() + ' span.currency').getText();
  }},

  putAddress: { value: function (address, currency) {
    return  this.gatewayAddressInput.sendKeys(address).
              then(this.currencyInput.clear).
              then(this.currencyInput.sendKeys.bind(this, currency));
  }},

  connectGateway: { value: function (addressOrName, currency, password) {
    return this.putAddress(addressOrName, currency).then(this.connectGatewaySubmit.bind(this, password));
  }},

  connectGatewaySubmit: { value: function (password) {
    var self = this;

    return helperBrowser.waitForElementToBecameAvailable(this.trustFormSubmitButton).
      then(this.trustFormSubmitButton.click).
      then(helperBrowser.waitForElementToDisplay.bind(self, this.confirmGatewayButton)).
      then(this.confirmGatewayButton.click).
      then(browser.sleep.bind(self, 1000)).
      then(this.unlockPasswordInput.isPresent).
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
  }},

  removeGateway: { value: function (currency) {
    return $('div.currency-' + currency.toLowerCase() + ' div.lines a[ng-click="edit_account()"]').click().
      then($('div.currency-' + currency.toLowerCase() + ' div.lines span[ng-show="editing && !advanced_feature_switch"] button[ng-click="delete_account()"]').click).
      then(helperBrowser.waitForElement.bind(this, this.gatewayRemovedHolder)).
      then(browser.sleep.bind(this, 1000));
  }},


  // for gateway advanced test
  gatewayTrustAmountInput: { get: function () { return $('#trust_amount'); }},
  advancedCurrencyInput: { get: function () { return $('form[name="trustForm"] div[ng-show="advanced_feature_switch"] #trust_amount_currency'); }},
  //  editLimitInput: { get: function () { return element(by.model('trust.limit')); }},
  editLimitInput: { get: function () { return  $('div.currency-usd input[name="limit"]'); }},
  usdGatewaySaveButton: { get: function () { return $('div.currency-usd div.lines div[ng-show="editing && advanced_feature_switch"] #save'); }},
  changesSavedHolder: { get: function () { return $('group[on="notif"] group.result-success[ng-switch-when="success"]'); }},
  // exactBinding not working - protractor is too old :(
  // usdGatewayLimitHolder: { get: function () { return element(by.css('div.currency-usd div.lines ')).element(by.exactBinding('component.limit')); }},
  usdGatewayLimitHolder: { get: function () { return $('div.currency-usd div.lines div[ng-show="advanced_feature_switch"] div.ng-binding'); }},
  usdGatewayAdvancedDeleteButton: { get: function () { return $('div.currency-usd div.lines div[ng-show="editing && advanced_feature_switch"] button[ng-click="delete_account()"]'); }},
  

  putAddressAdvanced: { value: function (address, currency, amount) {
    var self = this;
    return  this.gatewayAddressInput.sendKeys(address).
              then(this.advancedCurrencyInput.clear).
              then(this.advancedCurrencyInput.sendKeys.bind(this, currency)).
              then(this.gatewayTrustAmountInput.clear).
              then(this.gatewayTrustAmountInput.sendKeys.bind(this, amount));
  }},
  
});

module.exports = TrustPage;
