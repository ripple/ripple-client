var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'account';

AccountTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/account.jade')();
};

AccountTab.prototype.extraRoutes = [
  { name: '/account/:route' }
];

AccountTab.prototype.angular = function(module)
{
  module.controller('AccountCtrl', ['$scope', '$timeout', 'rpId', 'rpKeychain', '$routeParams',
    function ($scope, $timeout, $id, keychain, $routeParams)
    {
      if (!$routeParams.route) {
        $routeParams.route = 'public';

      if (!$id.loginStatus) return $id.goId();

        // Get the master key
        keychain.getSecret($id.account, $id.username, $scope.password,
          function (err, masterkey) {
            if (err) {
              console.log("client: account tab: error while " +
                "unlocking wallet: ", err);

              $scope.error = 'wrongpassword';
              $scope.loading = false;
              return;
            }

            // Rename
            $id.rename({
              new_username: $scope.username,
              password: $scope.password,
              masterkey: masterkey
            }, function(err){
              if (err) {
                console.log('client: account tab: error while ' +
                  'renaming account: ', err);
                $scope.error = true;
                $scope.loading = false;
                return;
              }

              // Re-login
              // TODO implement refresh/relogin in ID.
              $id.login({
                username: $scope.username,
                password: $scope.password
              }, function (err) {
                if (err) {
                  console.log('client: account tab: error while ' +
                    'logging user in: ', err);
                  $scope.error = 'cantlogin';
                  $scope.loading = false;
                  return;
                }

                $scope.success = true;
                reset();
              });
            });
          }
        );
      }

      var reset = function() {
        $scope.openForm = false;
        $scope.username = '';
        $scope.password = '';
        $scope.showPassword = true;
        $scope.loading = false;
        $scope.error = false;

        if ($scope.renameForm) {
          $scope.renameForm.$setPristine(true);
        }

      };

      reset();
      $scope.success = false;


      // PRIVATE INFORMATION
      var name = $scope.firstName;

      if (!$id.loginStatus) return $id.goId();

      //$scope.validation_pattern_name = /^[a-zA-Z0-9]{1,}$/;
      $scope.validation_pattern_day = /^([1-9]|[12]\d|3[0-1])$/;
      //$scope.validation_pattern_month = /^(0[1-9]|1[0-2])$/;
      $scope.validation_pattern_year = /^[0-9]{4}$/;
      $scope.validation_pattern_city = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;
      $scope.validation_pattern_state = /^[a-zA-Z\s]*$/;
      $scope.validation_pattern_zip = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
      $scope.validation_pattern_sss = /^[0-9]{4}$/;

      $scope.save = function () {
        var profile = $scope.profile;
        console.log(profile);
        console.log($scope.profile.name);
      }

      var genNum = function(start, end) {
        var arr = [];
        for (var i = start; i <= end; i++) {
          arr.push('' + i);
        }
        return arr;
      }

      $scope.days = genNum(1, 31);
      $scope.months = ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June',
        '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'];
      var currentYear = new Date().getFullYear();
      $scope.years = genNum(currentYear - 100, currentYear);

      $scope.rename = function() {
        $scope.loading = true;
        $scope.error = false;
      }
      
    }]
  );
};

module.exports = AccountTab;
