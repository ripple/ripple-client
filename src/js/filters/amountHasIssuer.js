'use strict';

angular.module('filters')
  .filter('rpAmountHasIssuer', rpAmountHasIssuer);

/**
 * @desc Returns true if at least one object has amount with valid and non-XRP issuer.
 * @param {Array | Object} input Input
 * @returns {Boolean}
 */
function rpAmountHasIssuer() {
  return function (input) {
    if (!input) return;

    if (!_.isArray(input)) {
      input = [input];
    }
    return _.any(input, function(v) {
      return !!v.amount.issuer().to_json();
    });
  }
}
