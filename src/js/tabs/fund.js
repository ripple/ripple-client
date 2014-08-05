var util = require('util'),
    Tab = require('../client/tab').Tab;

var FundTab = function ()
{
  Tab.call(this);
};

util.inherits(FundTab, Tab);

FundTab.prototype.tabName = 'fund';
FundTab.prototype.mainMenu = 'fund';

FundTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

FundTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/fund.jade')();
};

FundTab.prototype.angular = function (module)
{
  module.controller('FundCtrl', ['$rootScope', 'rpId', 'rpAppManager', 'rpTracker',
                                     function ($scope, $id, appManager, rpTracker)
  {
    $scope.currencyPage = 'xrp';
    $scope.accountLines = {};
    $scope.showComponent = [];

    if (!$id.loginStatus) return $id.goId();

    var updateAccountLines = function(currArr) {
      var obj = {};
      currArr = currArr || [];

      for (var i = 0; i < currArr.length; i++) {
        var currentEntry = currArr[i];
        var newEntry = {
          currency: currentEntry.currency,
          issuer: currentEntry.account,
          balance: ripple.Amount.from_json({ currency: currentEntry.currency, value: currentEntry.balance, issuer: currentEntry.account }),
          max: currentEntry.limit,
          min: currentEntry.limit_peer,
          rippling: currentEntry.no_ripple_peer ? 'On' : 'Off'
        }

        if (obj[currentEntry.currency] === undefined) {
          obj[currentEntry.currency] = { components: [], amtObj: null };
          obj[currentEntry.currency].amtObj = ripple.Amount.from_json({currency: currentEntry.currency, value: currentEntry.balance, issuer: currentEntry.account});
        }

        obj[currentEntry.currency].components.push(newEntry);
      }

      $scope.accountLines = obj;
      console.log('$scope.accountLines is: ', $scope.accountLines);

      return;
    }

    $scope.openPopup = function () {
      $scope.emailError = false;
      rpTracker.track('B2R Show Connect');
    };

    // B2R Signup
    $scope.B2RSignup = function () {
      var fields = {};

      $scope.loading = true;

      fields.rippleAddress = $id.account;

      fields.email = $scope.userBlob.data.email;

      $scope.B2RApp.findProfile('account').signup(fields,function(err, response){
        if (err) {
          console.log('Error',err);
          $scope.emailError = true;
          $scope.loading = false;

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
      });

      $scope.B2R.progress = true;

      rpTracker.track('B2R Shared Email');
    };

    $scope.$watch('_trustlines', function(line) {
      $scope.trustlines = $scope._trustlines;
      console.log('$scope.trustlines is: ', $scope.trustlines);
      updateAccountLines($scope.trustlines);
    }, true);

  }]);
};

module.exports = FundTab;
