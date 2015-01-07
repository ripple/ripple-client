var webutil = require('../../util/web');
/**
 * Show contact name or address
 */
angular
  .module('filters', [])
  .filter('rpcontactname', ['$rootScope', function ($scope) {
  return function (address) {
    address = address ? ""+address : "";

    var contact = webutil.getContact($scope.userBlob.data.contacts, address);

    if (!contact) {
      return address.substring(0, 7) + "…";
    }

    return contact.name;
  };
}]);
