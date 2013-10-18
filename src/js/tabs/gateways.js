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

    $scope.form = {};

    // TODO request results should be stored in blob
    $scope.$watch('address',function(){
      if (!$rootScope.zipzap && $scope.address) {
        $scope.loading = true;

        // Get ZipZap account
        $zipzap.getAccount($scope.address);
        $zipzap.request(function(response){
          $scope.$apply(function () {
            if (response.AcctStatus === 'Active') {
              $rootScope.zipzap = response ? response : null;
            }
            $scope.loading = false;
          })
        });
      }
    });

    // TODO ability to edit account details

    $scope.signup = function() {
      $scope.signupProgress = 'loading';

      // Create zipzap account, fund the ripple wallet
      $zipzap.register($id.account,$scope.form);
      $zipzap.request(function(response){
        $scope.$apply(function () {
          $scope.signupProgress = false;
          if (response.ZipZapAcctNum) {
            $rootScope.zipzap = response;
            $scope.displaySignupForm = false;
            $scope.details = true;
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

          if (!response.PayCenters || (response.PayCenters && !response.PayCenters.length))
            $scope.locateStatus = 'notfound';
        });
      })
    }
  }]);

  module.directive('rpDob', function () {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, elm, attr, ctrl) {
        if (!ctrl) return;

        var pattern = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

        var validator = function(value) {
          ctrl.$setValidity('rpDob', pattern.test(value));
          return value;
        };

        ctrl.$formatters.push(validator);
        ctrl.$parsers.unshift(validator);

        attr.$observe('rpDob', function() {
          validator(ctrl.$viewValue);
        });
      }
    };
  });
};

module.exports = GatewaysTab;