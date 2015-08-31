var util = require('util'),
    Tab = require('../client/tab').Tab;

var BtcTab = function ()
{
  Tab.call(this);
};

util.inherits(BtcTab, Tab);

BtcTab.prototype.tabName = 'btc';
BtcTab.prototype.mainMenu = 'fund';

BtcTab.prototype.angular = function (module)
{
  module.controller('BtcCtrl', ['$scope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams', 'rpNetwork', 'rpKeychain',
                                     function ($scope, id, appManager, rpTracker, $routeParams, network, keychain)
  {
    $scope.accountLines = {};
    $scope.showComponent = [];
    $scope.showInstructions = false;
    $scope.btcConnected = false;
    $scope.emailError = false;
    $scope.generalError = false;

    $scope.countryDisallowed = (store.get('profile_country') === 'US');
    $scope.profileUnverified = (store.get('profile_status') !== 'verified');

    $scope.toggle_instructions = function () {
      $scope.showInstructions = !$scope.showInstructions;
    };

    $scope.toggle_btc_instructions = function () {
      $scope.showBtcInstructions = !$scope.showBtcInstructions;
    };

    $scope.openPopup = function () {
      $scope.emailError = false;
      $scope.generalError = false;
      rpTracker.track('B2R Show Connect');
    };

    // TODO don't worry, the whole thing needs to be rewritten
    var btcwatcher = $scope.$watch('B2R', function(){
      if ($scope.B2R && $scope.B2R.active) {
        $scope.btcConnected = true;

        btcwatcher();
      }
    }, true);

    // B2R Signup
    $scope.B2RSignup = function () {
      var issuer = Options.b2rAddress;
      var currency = 'BTC';
      var amount = '100000000000';

      fields = {};

      fields.rippleAddress = id.account;
      fields.email = $scope.userBlob.data.email;

      keychain.requestSecret(id.account, id.username, function (err, secret) {
        if (err) {
          console.log("client: trust profile: error while " +
            "unlocking wallet: ", err);
          $scope.mode = "error";
          $scope.error_type = "unlockFailed";

          return;
        }

        var tx = network.remote.transaction();
        tx.rippleLineSet(id.account, amount + '/' + currency + '/' + issuer);
        tx.secret(secret);
        tx.setFlags('NoRipple');
        tx.tx_json.Sequence = 1;
        tx.complete();
        tx.sign();
        fields.txBlob = tx.serialize().to_hex();

        $scope.B2RApp.findProfile('account').signup(fields, function (err, response) {
          if (err) {
            console.log('Error', err);
            if (err && err.message == 'E-mail address is not accepted') {
              $scope.load_notification('emailError');
              $scope.emailError = true;
            } else {
              $scope.load_notification('error');
              $scope.generalError = true;
            }
            $scope.btcConnected = false;

            rpTracker.track('B2R SignUp', {
              result: 'failed',
              message: err.message
            });
            return;
          }

          $scope.B2RApp.refresh();

          $scope.B2RSignupResponse = response;

          rpTracker.track('B2R SignUp', {
            result: 'success'
          });

          $scope.load_notification('success');

          $scope.btcConnected = true;
          $scope.showInstructions = true;

        });
      });

      $scope.B2R.progress = true;

      rpTracker.track('B2R Shared Email');
    };

    $scope.save_btc_account = function (){

        $scope.btcLoading = true;

        var amount = ripple.Amount.from_human(
            Options.gateway_max_limit + ' ' + 'BTC',
            {reference_date: new Date(+new Date() + 5*60000)}
        );

        amount.set_issuer("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");

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

                $scope.btcLoading = false;
                $scope.btcediting = false;
              });
            })
            .on('error', function (res) {
              setEngineStatus(res, false);
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {
                  $scope.btcMode = 'error';

                  $scope.btcLoading = false;
                  $scope.btcediting = false;
                });
              });
            });

        function setEngineStatus(res, accepted) {
          $scope.btc_engine_result = res.engine_result;
          $scope.btc_engine_result_message = res.engine_result_message;
          $scope.btc_engine_status_accepted = accepted;

          switch (res.engine_result.slice(0, 3)) {
            case 'tes':
              $scope.btc_tx_result = accepted ? 'cleared' : 'pending';
              break;
            case 'tem':
              $scope.btc_tx_result = 'malformed';
              break;
            case 'ter':
              $scope.btc_tx_result = 'failed';
              break;
            case 'tec':
              $scope.btc_tx_result = 'failed';
              break;
            case 'tel':
              $scope.btc_tx_result = "local";
              break;
            case 'tep':
              console.warn('Unhandled engine status encountered!');
          }
          if ($scope.btc_tx_result=="cleared"){
            $scope.btc2Connected = true;
            $scope.showBtcInstructions = true;

          }
          console.log($scope.btc_tx_result);
        }

        keychain.requestSecret(id.account, id.username, function (err, secret) {
          // XXX Error handling
          if (err) {
            $scope.btcLoading = false;
            console.log(err);
            return;
          }

          $scope.btcMode = 'granting';

          tx.secret(secret);
          tx.submit();


        });
        
      };

    $scope.$watch('lines', function () {
        if($scope.lines['rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BBTC']){
          $scope.btc2Connected = true;
        }
        else {
          $scope.btc2Connected = false;
        }  
      }, true);

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

module.exports = BtcTab;
