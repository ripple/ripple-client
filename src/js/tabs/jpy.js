var util = require('util'),
    Tab = require('../client/tab').Tab;

var JpyTab = function ()
{
  Tab.call(this);
};

util.inherits(JpyTab, Tab);

JpyTab.prototype.tabName = 'jpy';
JpyTab.prototype.mainMenu = 'fund';

JpyTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

JpyTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/jpy.jade')();
};

JpyTab.prototype.angular = function (module)
{
  module.controller('JpyCtrl', ['$scope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams', 'rpKeychain', 'rpNetwork', '$timeout',
    function ($scope, $id, appManager, rpTracker, $routeParams, keychain, $network, $timeout)
    {
      
      $scope.toggle_instructions = function (){
        $scope.showInstructions = !$scope.showInstructions;
      }

      $scope.save_account = function (){

        $scope.loading = true;

        var amount = ripple.Amount.from_human(
            Options.gateway_max_limit + ' ' + 'JPY',
            {reference_date: new Date(+new Date() + 5*60000)}
        );

        amount.set_issuer("r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN");

        if (!amount.is_valid()) {
          // Invalid amount. Indicates a bug in one of the validators.
          console.log('Invalid amount');
          return;
        }

        var tx = $network.remote.transaction();

        // Add memo to tx
        tx.addMemo('client', 'rt' + $scope.version);

        // Flags
        tx
            .rippleLineSet($id.account, amount)
            .on('proposed', function(res){
              $scope.$apply(function () {
                setEngineStatus(res, false);              
              });
            })
            .on('success', function (res) {
              $scope.$apply(function () {
                setEngineStatus(res, true);

                $scope.loading = false;
                $scope.editing = false;
              });
            })
            .on('error', function (res) {
              setEngineStatus(res, false);
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {
                  $scope.mode = 'error';

                  $scope.loading = false;
                  $scope.editing = false;
                });
              });
            });

        function setEngineStatus(res, accepted) {
          $scope.engine_result = res.engine_result;
          $scope.engine_result_message = res.engine_result_message;
          $scope.engine_status_accepted = accepted;

          switch (res.engine_result.slice(0, 3)) {
            case 'tes':
              $scope.tx_result = accepted ? 'cleared' : 'pending';
              break;
            case 'tem':
              $scope.tx_result = 'malformed';
              break;
            case 'ter':
              $scope.tx_result = 'failed';
              break;
            case 'tec':
              $scope.tx_result = 'failed';
              break;
            case 'tel':
              $scope.tx_result = "local";
              break;
            case 'tep':
              console.warn('Unhandled engine status encountered!');
          }
          if ($scope.tx_result=="cleared"){
            $scope.jpyConnected = true;
            $scope.showInstructions = true;

          }
          console.log($scope.tx_result);
        }

        keychain.requestSecret($id.account, $id.username, function (err, secret) {
          // XXX Error handling
          if (err) {
            $scope.loading = false;
            console.log(err);
            return;
          }

          $scope.mode = 'granting';

          tx.secret(secret);
          tx.submit();


        });
        
      };

      $scope.$watch('lines', function () {
        if($scope.lines['r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcNJPY']){
          $scope.jpyConnected = true;
        }
        else {
          $scope.jpyConnected = false;
        }
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

module.exports = JpyTab;
