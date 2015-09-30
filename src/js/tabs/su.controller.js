var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base;

var SuTab = function ()
{
  Tab.call(this);
};

util.inherits(SuTab, Tab);

SuTab.prototype.tabName = 'su';
SuTab.prototype.mainMenu = 'su';

SuTab.prototype.angular = function (module)
{
  module.controller('SuCtrl', ['$scope', '$routeParams', 'rpId',
                               'rpNetwork', 'rpDomainAlias', 'rpKeychain', 'rpAPI',
    function ($scope, $routeParams, id, net, aliasService, keychain, api)
  {
    $scope.account = {};

    // Get account
    $scope.$on('$idAccountLoad', function (e, data) {
      var alias = aliasService.getAliasForAddress(data.account);

      alias.then(
        function(domain){
          $scope.account.domain = domain;
        },
        function(reason){
          console.log('error', reason);
        }
      );
    });

    $scope.accountSet = function() {
      var tx = net.remote.transaction();

      tx.accountSet(id.account);
      tx.tx_json.Domain = sjcl.codec.hex.fromBits(sjcl.codec.utf8String.toBits($scope.account.domain));
      tx.on('success', function(res) {
        console.log('Cool!');

        api.addTransaction(res.tx_json, {Status: 'success'}, res.tx_json.hash, new Date().toString());
      });

      tx.on('error', function(res) {
        console.log('Error!');

        api.addTransaction(res.tx_json, {Status: 'error'}, res.tx_json.hash, new Date().toString());
      });

      keychain.requestSecret(id.account, id.username, function (err, secret) {
        // TODO Error handling
        if (err) return;

        tx.secret(secret);

        api.getUserAccess().then(function(res) {
          tx.submit();
        }, function(err) {
          console.log('Error!');
        });

      });
    };
  }]);
};

module.exports = SuTab;
