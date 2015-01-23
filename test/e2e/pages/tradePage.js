'use strict';

var helperBrowser = require('../utils/browser');

var TradePage = function () {
  this.myOrdersMsgHolder    = $('#myOrdersMsg');
  this.currencyPairInput    = $('#currency_pair');
  this.sellXRPButton        = $('form[name="tradeForm"] button[btn-type="sell"]');
  this.sellAmountInput      = $('form[name="tradeForm"] input[name="amount"][input-type="sell"]');
  this.sellPriceInput       = $('form[name="tradeForm"] input[name="price"][input-type="sell"]');
  this.confirmFatButton     = $('form.mode-confirm button.submit');
  this.unlockPasswordInput  = $("div.modal-dialog #popup_unlock_password");
  this.unlockPasswordButton = $("div.modal-dialog div.unlock-btns-wrapper button.modal-submit-btn");

  this.orderIsActiveMsg     = $("group.result-success[ng-show=\"tx_result=='cleared' && executedOnOfferCreate=='none'\"]");
  this.submitAnotherButton  = $("a[ng-click=\"reset_widget(type)\"]");
  this.qtyHead              = $('div[rp-sort-header-field="qty"]');
  this.limitHead            = $('div[rp-sort-header-field="limit"]');
  this.qty                  = $$("div[data-label='QTY']");
  this.limit                = $$("div[data-label='Limit']");
  this.currentPairOnly      = $('input[name="current_pair_only"]');
  this.cancelAll            = $('.listings .my .row rp-popup a.btn-cancel.btn-a');
  this.cancelAllConfirm     = $('body div.modal button[ng-click="cancel_all_orders()"]');
};

TradePage.prototype.goTo = function () {
  browser.get('#/trade'); 
}

TradePage.prototype.setCurrencyPair = function (pair) {
  var self = this;
  return this.currencyPairInput.clear().
          then(function() {
            return self.currencyPairInput.sendKeys(pair, protractor.Key.ENTER);
          });
}

TradePage.prototype.enterOrder = function (amount, price) {
  var self = this;
  return helperBrowser.waitForElement(this.sellAmountInput).
          then(this.sellAmountInput.clear).
          then(function() {
            return self.sellAmountInput.sendKeys(amount);
          }).
          then(this.sellPriceInput.clear).
          then(function() {
            return self.sellPriceInput.sendKeys(price);
          });
}

TradePage.prototype.confirmOrder = function (password) {
  var self = this;

  return helperBrowser.waitForElementToBecameAvailable(this.confirmFatButton).
    then(this.confirmFatButton.click).
    then(browser.sleep.bind(self, 1000)).
    then(function() {
      return self.unlockPasswordInput.isDisplayed();
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
    then(helperBrowser.waitForElement.bind(self, this.orderIsActiveMsg)).
    then(this.submitAnotherButton.click);
}

TradePage.prototype.cancelAllOrders = function (password) {
  var self = this;

  return helperBrowser.waitForElementToDisplay(this.cancelAll).
    then(this.cancelAll.click).
    then(browser.sleep.bind(self, 10)).
    then(this.cancelAllConfirm.click).
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
    });
}


module.exports = TradePage;
