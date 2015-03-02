'use strict';

var AdvancedPage = function () {
  this.editAdvancedSettingsButton = $('form[name="accountsAdvForm"] div[ng-hide="editAcctOptions"] a.btn-cancel');
  this.showAdvancedOptionsInput = $('input[name="acct_adv"]');
  this.saveAdvancedSettingsButton = $('form[name="accountsAdvForm"] #save');
  this.advancedSettingsShowHolder = $('form[name="accountsAdvForm"] div[ng-show="options.advanced_feature_switch"]');
  this.advancedSettingsHideHolder = $('form[name="accountsAdvForm"] div[ng-hide="options.advanced_feature_switch"]');
};

AdvancedPage.prototype.goTo = function () {
  browser.get('#/advanced'); 
}


module.exports = AdvancedPage;
