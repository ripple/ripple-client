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
  module.controller('JpyCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams', 'rpKeychain', 'rpNetwork', '$timeout',
    function ($scope, $id, appManager, rpTracker, $routeParams, keychain, $network, $timeout) {

      if (!$id.loginStatus) return $id.goId();

      $scope.showInstructions = store.get('show_jpy_instructions');
      $scope.jpyConnected = store.get('jpy_connected');

      if (!$scope.account.Balance){
        store.set('jpy_connected', false);
      }
      
      $scope.toggle_instructions = function (){
        $scope.showInstructions = !$scope.showInstructions;
        store.set('show_jpy_instructions', $scope.showInstructions);
      }
      $scope.save_account = function (){
        $scope.loading = true;
      
        $scope.load_notification('loading');

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
            .on('success', function (res) {
              $scope.$apply(function () {
                setEngineStatus(res, true);

                $scope.loading = false;
                $scope.load_notification('success');
                $scope.editing = false;
              });
            })
            .on('error', function (res) {
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {
                  $scope.mode = 'error';

                  $scope.loading = false;
                  $scope.load_notification("error");
                  $scope.editing = false;
                });
              });
            });

        function setEngineStatus(res, accepted) {
          $scope.engine_result = res.engine_result;
          $scope.engine_result_message = res.engine_result_message;

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

            // Save in local storage
            if (!store.disabled) {
              store.set('jpy_connected', $scope.jpyConnected);
              store.set('show_jpy_instructions', $scope.showInstructions);
            }

          }
          console.log($scope.tx_result);
        }

        keychain.requestSecret($id.account, $id.username, function (err, secret) {
          // XXX Error handling
          if (err) {
            $scope.loading = false;
            $scope.load_notification('error');
            console.log(err);
            return;
          }

          $scope.mode = 'granting';

          console.log($scope.tx_result);

          tx.secret(secret);
          tx.submit();


        });
        
        $timeout(function(){
          $scope.mode = 'main';
        }, 10000);

      }
    }]);

};

module.exports = JpyTab;
