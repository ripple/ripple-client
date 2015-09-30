var util = require('util'),
    Tab = require('../client/tab').Tab;

var UsdTab = function ()
{
  Tab.call(this);
};

util.inherits(UsdTab, Tab);

UsdTab.prototype.tabName = 'usd';
UsdTab.prototype.mainMenu = 'fund';

UsdTab.prototype.extraRoutes = [
  { name: '/usd/:result' }
];

UsdTab.prototype.angular = function (module)
{
  module.controller('UsdCtrl', ['$scope', 'rpId', 'rpAppManager', 'rpTracker',
    '$routeParams', 'rpKeychain', 'rpNetwork', 'rpAPI', '$timeout',
    function ($scope, id, appManager, rpTracker, $routeParams, keychain, network, api, $timeout)
    {

      $scope.toggle_usd_instructions = function() {
        $scope.showUsdInstructions = !$scope.showUsdInstructions;
      };

      $scope.toggle_gatehub_instructions = function() {
        $scope.showUsd3Instructions = !$scope.showUsd3Instructions;
      };

      $scope.save_usd_account = function () {

        $scope.usdLoading = true;

        var amount = ripple.Amount.from_human(
            Options.gateway_max_limit + ' ' + 'USD',
            {reference_date: new Date(+new Date() + 5 * 60000)}
        );

        amount.set_issuer('rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B');

        if (!amount.is_valid()) {
          // Invalid amount. Indicates a bug in one of the validators.
          console.log('Invalid amount');
          return;
        }

        var tx = network.remote.transaction();

        // Add memo to tx
        tx.addMemo('client', 'text/plain', 'rt' + $scope.version);

        // Flags
        tx
            .rippleLineSet(id.account, amount)
            .on('proposed', function(res) {
              $scope.$apply(function () {
                setEngineStatus(res, false);              
              });
            })
            .on('success', function (res) {
              $scope.$apply(function () {
                setEngineStatus(res, true);

                $scope.usdLoading = false;
                $scope.usdediting = false;
              });

              api.addTransaction(res.tx_json, {Status: 'success'}, res.tx_json.hash, new Date().toString());
          })
            .on('error', function (res) {
              setEngineStatus(res, false);
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {
                  $scope.usdMode = 'error';

                  $scope.usdLoading = false;
                  $scope.usdediting = false;
                });
              });

              api.addTransaction(res.tx_json, {Status: 'error'}, res.tx_json.hash, new Date().toString());
          });

        function setEngineStatus(res, accepted) {
          $scope.usd_engine_result = res.engine_result;
          $scope.usd_engine_result_message = res.engine_result_message;
          $scope.usd_engine_status_accepted = accepted;

          switch (res.engine_result.slice(0, 3)) {
            case 'tes':
              $scope.usd_tx_result = accepted ? 'cleared' : 'pending';
              break;
            case 'tem':
              $scope.usd_tx_result = 'malformed';
              break;
            case 'ter':
              $scope.usd_tx_result = 'failed';
              break;
            case 'tec':
              $scope.usd_tx_result = 'failed';
              break;
            case 'tel':
              $scope.usd_tx_result = 'local';
              break;
            case 'tep':
              console.warn('Unhandled engine status encountered!');
          }
          if ($scope.usd_tx_result === 'cleared') {
            $scope.usd2Connected = true;
            $scope.showUsdInstructions = true;

          }
          console.log($scope.usd_tx_result);
        }

        keychain.requestSecret(id.account, id.username, function (err, secret) {
          // XXX Error handling
          if (err) {
            $scope.usdLoading = false;
            console.log(err);
            return;
          }

          $scope.usdMode = 'granting';

          tx.secret(secret);

          api.getUserAccess().then(function(res) {
            tx.submit();
          }, function(err2) {
            console.log('error', err2);
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.usdMode = 'error';

                $scope.usdLoading = false;
                $scope.usdediting = false;
              });
            });
          });

        });
      };

      $scope.save_gatehub_account = function() {
        $scope.usd3Loading = true;

        var amount = ripple.Amount.from_human(
            Options.gateway_max_limit + ' ' + 'USD',
            {reference_date: new Date(+new Date() + 5*60000)}
        );

        amount.set_issuer('rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq');

        if (!amount.is_valid()) {
          // Invalid amount. Indicates a bug in one of the validators.
          console.log('Invalid amount');
          return;
        }

        var tx = network.remote.transaction();

        // Add memo to tx
        tx.addMemo('client', 'text/plain', 'rt' + $scope.version);

        // Flags
        tx
            .rippleLineSet(id.account, amount)
            .on('proposed', function(res){
              $scope.$apply(function () {
                setEngineStatus(res, false);
              });
            })
            .on('success', function (res) {
              $scope.$apply(function () {
                setEngineStatus(res, true);

                $scope.usd3Loading = false;
              });

              api.addTransaction(res.tx_json, {Status: 'success'}, res.tx_json.hash, new Date().toString());
            })
            .on('error', function (res) {
              setEngineStatus(res, false);
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {
                  $scope.usd3Loading = false;
                });
              });

              api.addTransaction(res.tx_json, {Status: 'error'}, res.tx_json.hash, new Date().toString());
          });

        function setEngineStatus(res, accepted) {
          $scope.usd3_engine_result = res.engine_result;
          $scope.usd3_engine_result_message = res.engine_result_message;
          $scope.usd3_engine_status_accepted = accepted;

          switch (res.engine_result.slice(0, 3)) {
            case 'tes':
              $scope.usd3_tx_result = accepted ? 'cleared' : 'pending';
              break;
            case 'tem':
              $scope.usd3_tx_result = 'malformed';
              break;
            case 'ter':
              $scope.usd3_tx_result = 'failed';
              break;
            case 'tec':
              $scope.usd3_tx_result = 'failed';
              break;
            case 'tel':
              $scope.usd3_tx_result = 'local';
              break;
            case 'tep':
              console.warn('Unhandled engine status encountered!');
          }
          if ($scope.usd3_tx_result === 'cleared') {
            $scope.usd3Connected = true;
            $scope.showUsd3Instructions = true;
          }
          console.log($scope.usd3_tx_result);
        }

        keychain.requestSecret(id.account, id.username, function(err, secret) {
          // XXX Error handling
          if (err) {
            $scope.usd3Loading = false;
            console.log(err);
            return;
          }

          tx.secret(secret);

          api.getUserAccess().then(function(res) {
            tx.submit();
          }, function(err2) {
            console.log('error', err2);
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.usd3Loading = false;
              });
            });
          });
        });
      };

      $scope.$watch('lines', function() {
        $scope.usd2Connected = !!$scope.lines.rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BUSD;
        $scope.usd3Connected = !!$scope.lines.rhub8VRN55s94qWKDv6jmDy1pUykJzF3wqUSD;
      }, true);

      // User should be notified if the reserve is insufficient to add a gateway
      $scope.$watch('account', function() {
        $scope.can_add_trust = false;
        if ($scope.account.Balance && $scope.account.reserve_to_add_trust) {
          if (!$scope.account.reserve_to_add_trust.subtract($scope.account.Balance).is_positive()
            || $.isEmptyObject($scope.lines))
          {
            $scope.can_add_trust = true;
          }
        }
      }, true);
    }]);
};

module.exports = UsdTab;
