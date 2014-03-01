var util = require('util'),
    Tab = require('../client/tab').Tab;

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.tabName = 'balance';
BalanceTab.prototype.mainMenu = 'wallet';

BalanceTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/balance.jade')();
};

BalanceTab.prototype.angular = function (module)
{
  module.controller('BalanceCtrl', ['$rootScope', 'rpId', 'rpAppManager',
                                     function ($scope, $id, appManager)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.showComponent = [];
    var appsLoaded;

    // watch the address function and detect when it changes so we can inject
    // the qr
    // TODO don't need this anymore
    $scope.$watch('address', function(){
      if ($scope.address !== undefined)
      // use jquery qr code library to inject qr code into div
        $('#qr-code').qrcode({
          width: 200,
          height: 200,
          text: 'https://ripple.com//contact?to=' + $scope.address
        });
    }, true);

    // BTC2Ripple
    $scope.btc2rippleFieldValue = {};

    var checkBTC2RippleUser = function(accountProfile) {
      accountProfile.getUser($scope.address, function(err, user){
        if (err) {
          console.log('Error', err);
          return;
        }
        console.log('user',user);

        $scope.btc2ripple.active = user;

        // Do the necessary trust
        $scope.btc2ripple.trust('BTC','rhxULAn1xW9T4V2u67FX9pQjSz4Tay2zjZ');

        // Get deposit instructions
        $scope.btc2ripple.getInstructions($scope.address,function(err, instructions){
          if (err) {
            return;
          }

          $scope.btc2ripple.instructions = instructions;
        });
      });
    };

    appManager.getApp('rD1jovjQeEpvaDwn9wKaYokkXXrqo4D23x', function(err, app){
      $scope.btc2ripple = app.getInboundBridge('BTC');

      var accountProfile = app.findProfile('account');

      checkBTC2RippleUser(accountProfile);

      // Required fields
      $scope.btc2rippleSignupFields = accountProfile.getFields();

      // Signup
      $scope.btc2rippleSignup = function () {
        var fields = $scope.btc2rippleFieldValue;
        fields.rippleAddress = $id.account;

        accountProfile.signup(fields,function(err, response){
          if (err) {
            console.log('Error',err.message);
            return;
          }

          checkBTC2RippleUser(accountProfile);

          $scope.btc2rippleSignupResponse = response;
        });
      };
    });

    // Try to identify apps behind the balance issuers
    $scope.$watch('balances', function() {
      if ($.isEmptyObject($scope.balances) || appsLoaded) return;

      // TODO be more smart doing requests, one app may have multiple currencies
      _.each($scope.balances, function(balance) {
        _.each(balance.components, function(component,key) {
          // TODO REMOVE
          if (key == 'rhxULAn1xW9T4V2u67FX9pQjSz4Tay2zjZ')
            key = 'rD1jovjQeEpvaDwn9wKaYokkXXrqo4D23x'

          appManager.getApp(key, function(err, app){
            component.app = app;
            component.inboundBridge = app.getInboundBridge(component.currency().to_human());

            // Get app user
            app.findProfile('account').getUser($scope.address, function(err, user){
              if (err) {
                console.log('Error', err);
                return;
              }

              component.app.user = user;

              // Get inbound bridge instructions
              component.inboundBridge.getInstructions($scope.address,function(err, instructions){
                if (err) {
                  return;
                }

                component.inboundBridge.instructions = instructions;
              });
            });
          });
        })
      });

      appsLoaded = true;
    }, true);
  }]);
};

module.exports = BalanceTab;
