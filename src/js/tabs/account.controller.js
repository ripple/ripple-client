var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'account';

AccountTab.prototype.extraRoutes = [
  { name: '/account/:route' }
];

AccountTab.prototype.angular = function(module)
{
  module.controller('AccountCtrl', ['$scope', '$timeout', 'rpId', 'rpKeychain', '$routeParams',
    function ($scope, $timeout, id, keychain, $routeParams)
    {
      if (!$routeParams.route) $routeParams.route = 'public';

      $scope.rename = function() {
        $scope.loading = true;
        $scope.error = false;
        // Get the master key
        keychain.getSecret(id.account, id.username, $scope.password,
          function (err, masterkey) {
            if (err) {
              console.log('client: account tab: error while ' +
                'unlocking wallet: ', err);

              if (err instanceof Error && typeof err.message === 'string' && err.message.indexOf('PAKDF') !== -1) {
                $scope.error = 'server';
              } else {
                $scope.error = 'wrongpassword';
              }

              $scope.loading = false;
              return;
            }

            // Rename
            id.rename({
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
              id.login({
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
      };

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

    }]
  );
};

module.exports = AccountTab;
