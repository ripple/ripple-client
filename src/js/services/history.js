/**
 * Ripple Transaction History API
 */

angular
  .module('history', [])
  .factory('rpHistory', ['$rootScope', '$http', 'rpNetwork', function ($scope, $http, network)
{
  var rpHistory = function(account){
    this.account = account;
    this.accountObj = network.remote.account(this.account);
  };

  rpHistory.prototype.getHistory = function (opts, callback) {
    $http({
      url: Options.historyApi + '/accounts/' + this.account + '/transactions',
      method: 'GET',
      params: opts
    })
    .success(function(data) {
      callback(null, data);
    })
    .error(function(err){
      callback(err);
    });
  };

  rpHistory.prototype.onTransaction = function (callback) {
    this.accountObj.on('transaction', callback);
  };

  return rpHistory;
}]);