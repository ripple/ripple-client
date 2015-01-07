/**
 * Field uniqueness validator scope for group mode. rpUniqueField must be present.
 *
 * @example
 *   <div rp-unique-scope>
 *     <input ng-model="name" rp-unique="addressbook" rp-unique-field="name"> // this will not join the group
 *     <input ng-model="address" rp-unique="addressbook" rp-unique-field="address" rp-unique-group="address-dt">
 *     <input ng-model="dt" rp-unique="addressbook" rp-unique-field="dt" rp-unique-group="address-dt">
 *   </div>
 */
var RP_UNIQUE_SCOPE = "rp-unique-scope";
angular
  .module('validators', [])
  .directive('rpUniqueScope', function() {
  return {
    restrict: 'EA',
    link: {
      pre: function ($scope, elm) {
        elm.data(RP_UNIQUE_SCOPE, {});
      }
    }
  };
});
