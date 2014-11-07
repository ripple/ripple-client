var util = require('util'),
    Tab = require('../client/tab').Tab;

var BtcTab = function ()
{
  Tab.call(this);
};

util.inherits(BtcTab, Tab);

BtcTab.prototype.tabName = 'btc';
BtcTab.prototype.mainMenu = 'fund';

BtcTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

BtcTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/btc.jade')();
};

BtcTab.prototype.angular = function (module)
{
  module.controller('BtcCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams', 'rpKeychain',
                                     function ($scope, $id, appManager, rpTracker, $routeParams, keychain)
  {
 
    $scope.accountLines = {};
    $scope.showComponent = [];
    $scope.showInstructions = false;

    $scope.$watch('lines', function () {
      if($scope.lines['rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2qBTC']){
        $scope.btcConnected = true;
      }
      else {
        $scope.btcConnected = false;
      }
    }, true);

    if (!$id.loginStatus) return $id.goId();

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
      var fields = {};

      $scope.loading = true;

      fields.rippleAddress = $id.account;

      fields.email = $scope.userBlob.data.email;

      keychain.requestSecret($id.account, $id.username, function (err, secret) {
        if (err) {
          console.log("client: trust profile: error while " +
            "unlocking wallet: ", err);
          $scope.mode = "error";
          $scope.error_type = "unlockFailed";
          $scope.loading = false;
          return;
        }

        $scope.B2RApp.findProfile('account').signup(fields, function (err, response) {
          if (err) {
            console.log('Error', err);
            $scope.emailError = true;
            $scope.loading = false;
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
          $scope.loading = false;

          console.log('success');

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
