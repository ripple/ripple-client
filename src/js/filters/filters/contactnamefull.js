var webutil = require('../../util/web');
angular
  .module('filters', [])
  .filter('rpcontactnamefull', ['$rootScope', function ($scope) {
  return function (address) {
    address = address ? ""+address : "";
    var contact = webutil.getContact($scope.userBlob.data.contacts, address);

    if (!contact) {
      return "" + address;
    }

    return contact.name;
  };
}]);
