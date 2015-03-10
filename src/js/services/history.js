/**
 * Ripple Transaction History API
 */

angular
  .module('history', [])
  .factory('rpHistory', RpHistory);

RpHistory.$inject = ['$rootScope', '$http', 'rpNetwork'];

function RpHistory ($scope, $http, network)
{
  var rpHistory = function(account){
    this.account = account;
    this.accountObj = network.remote.account(this.account);
  };

  rpHistory.prototype.getHistory = function (opts) {
    return $http({
      url: Options.historyApi + '/accounts/' + this.account + '/transactions',
      method: 'GET',
      params: opts
    })
  };

  rpHistory.prototype.getCount = function (opts) {
    opts = jQuery.extend(true, {}, opts);

    delete opts.limit;
    delete opts.offset;

    opts.count = true;

    return this.getHistory(opts)
  };

  rpHistory.prototype.onTransaction = function (callback) {
    this.accountObj.on('transaction', callback);
  };

  return rpHistory;
}