var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var GatewaysTab = function ()
{
  Tab.call(this);
};

util.inherits(GatewaysTab, Tab);

GatewaysTab.prototype.mainMenu = 'wallet';

GatewaysTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/gateways.jade')();
};

GatewaysTab.prototype.angular = function (module)
{
  module.controller('GatewaysCtrl', ['$scope', '$rootScope', 'rpId', 'rpNetwork', 'rpZipzap',
  function ($scope, $rootScope, $id, $network, $zipzap)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.mode = 'list';
    $scope.form = {};

    // TODO request results should be stored in blob
    $scope.$watch('address',function(){
      if (!$rootScope.zipzap && $scope.address) {
        $scope.loading = true;

        // Get ZipZap account
        $zipzap.getAccount($scope.address);
        $zipzap.request(function(response){
          $scope.$apply(function () {
            $rootScope.zipzap = response ? response : null;
            $scope.loading = false;
          })
        });
      }
    });

    $scope.signup = function() {
      // Create zipzap account, fund the ripple wallet
      $zipzap.register($id.account,$scope.form);
      $zipzap.request(function(response){
        $scope.$apply(function () {
          if (response.ZipZapAcctNum) {
            $rootScope.zipzap = response;
            $scope.mode = 'details';
          } else {
            if (response && response.Message) {
              $scope.error = {
                'code': response.Code,
                'message': response.Message,
                'verboseMessage': response.VerboseMessage
              }
            } else {
              $scope.error = {
                'code': null,
                'message': 'Invalid form',
                'verboseMessage': 'Form is invalid, please make sure entered information is correct'
              }
            }
          }
        })
      });
    };

    // Locate ZipZap payment centers
    $scope.locate = function() {
      $scope.locateStatus = 'loading';

      $zipzap.locate($scope.query);
      $zipzap.request(function(response){
        $scope.$apply(function () {
          $scope.locations = response;
          $scope.locateStatus = false;
        });
      })
    }
  }]);
};

module.exports = GatewaysTab;