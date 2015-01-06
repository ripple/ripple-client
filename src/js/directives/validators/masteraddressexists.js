/*
 * Invalidate duplicate account_id's
 * consider the masterkey invalid unless the database does not have the derived account_id
 */
angular
  .module('validators', [])
  .directive('rpMasterAddressExists', function ($http) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      var validator = function(value) {
        if (!value || !Base.decode_check(33, value)) {
          ctrl.$setValidity('rpMasterAddressExists', true);
          return value;

        } else if (value) {
          ctrl.$setValidity('rpMasterAddressExists', false); //while checking
          scope.checkingMasterkey = true;
          var account_id = ripple.Seed.from_json(value).get_key().get_address().to_json();

          //NOTE: is there a better way to get the blobvault URL?         
          ripple.AuthInfo.get(Options.domain, "1", function(err, authInfo) {
            if (err) {
              scope.checkingMasterkey = false;
              return;
            }

            $http.get(authInfo.blobvault + '/v1/user/' + account_id)
              .success(function(data) {
                if (data.username) {
                  scope.masterkeyUsername = data.username;
                  scope.masterkeyAddress  = account_id;
                  ctrl.$setValidity('rpMasterAddressExists', false);
                  scope.checkingMasterkey = false;
                } else {
                  ctrl.$setValidity('rpMasterAddressExists', true);
                  scope.checkingMasterkey = false;
                }
              });
          });

          return value;
        }
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpMasterAddressExists', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});
