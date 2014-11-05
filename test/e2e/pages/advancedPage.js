'use strict';

var AdvancedPage = function () {
};

AdvancedPage.prototype = Object.create({}, {
  goTo: { value: function () { browser.get('#/advanced'); }},

  editAdvancedSettingsButton: { get: function () { return $('form[name="accountsAdvForm"] div[ng-hide="editAcctOptions"] a.btn-cancel'); }},
  showAdvancedOptionsInput: { get: function () { return $('input[name="acct_adv"]'); }},
  saveAdvancedSettingsButton: { get: function () { return $('form[name="accountsAdvForm"] #save'); }},
  advancedSettingsShowHolder: { get: function () { return $('form[name="accountsAdvForm"] div[ng-show="advanced_feature_switch"]'); }},
  advancedSettingsHideHolder: { get: function () { return $('form[name="accountsAdvForm"] div[ng-hide="advanced_feature_switch"]'); }},
});

module.exports = AdvancedPage;
