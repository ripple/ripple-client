/**
 * History profile
 *
 * This is the "History" profile implementation
 */

var module = angular.module('integrationHistory', []);

module.service('rpHistoryProfile', ['$rootScope', 'rpNetwork', '$http',
  function($scope, $network, $http)
{
  this.historyProfile = function(manifest) {
    return {
      transactions: function(rippleAddress, callback) {
        $http({
          url: manifest.urls.transactions,
          method: 'GET',
          data: {
            rippleAddress: rippleAddress
          }
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
            message: 'Unable to fetch the transactions info.'
          });
        })
      }
    }
  };

  this.fromManifest = function (manifest) {
    return new this.historyProfile(manifest);
  }
}]);