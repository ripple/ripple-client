/**
 * Account profile
 *
 * This is the "Account" profile implementation
 */

// TODO Sign sent data
angular
  .module('integrationAccount', [])
  .service('rpAccountProfile', ['$rootScope', 'rpNetwork', '$http',
  function($scope, $network, $http)
{
  this.accountProfile = function(manifest) {
    return {
      type: manifest.type,
      version: manifest.version,

      getFields: function () {
        return manifest.signupFields;
      },
      signup: function(fields, callback) {
        $http({
          url: manifest.urls.signup,
          method: 'POST',
          data: fields
        })
        .success(function(response){
          if (response.status === 'error') {
            callback({
              message: response.message
            });

            return;
          }

          callback(null, response);
        })
        .error(function(data,status){
          callback({
            message: 'Unable to sign up.'
          });
        });
      },
      getUser: function(rippleAddress, callback) {
        $http({
          url: manifest.urls.user,
          method: 'GET',
          params: {rippleAddress: rippleAddress}
        })
        .success(function(response){
          if (response.status === 'error') {
            callback({
              message: response.message
            });

            return;
          }

          callback(null, response);
        })
        .error(function(data,status){
          callback({
            message: "Can't get the user."
          });
        });
      }
    };
  };

  this.fromManifest = function (manifest) {
    return new this.accountProfile(manifest);
  };
}]);
