var util = require('util'),
    Tab = require('../client/tab').Tab;

var BtcTab = function ()
{
  Tab.call(this);
};

util.inherits(BtcTab, Tab);

BtcTab.prototype.tabName = 'btc';
BtcTab.prototype.mainMenu = 'fund';

BtcTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/btc.jade')();
};

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

    $scope.toggle_instructions = function () {
      $scope.showInstructions = !$scope.showInstructions;
    };

    $scope.openPopup = function () {
      $scope.emailError = false;
      rpTracker.track('B2R Show Connect');
    };

    // TODO don't worry, the whole thing needs to be rewritten
    var btcwatcher = $scope.$watch('B2R', function(){
      if ($scope.B2R && $scope.B2R.active) {
        $scope.btcConnected = true;

        btcwatcher();  
      }
    });

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
            $scope.emailError = true;
            $scope.btcConnected = false;
            $scope.load_notification('error');

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

  }]);
};

module.exports = BtcTab;
