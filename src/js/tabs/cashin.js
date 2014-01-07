var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var CashinTab = function ()
{
  Tab.call(this);
};

util.inherits(CashinTab, Tab);

CashinTab.prototype.tabName = 'cashin';
CashinTab.prototype.mainMenu = 'wallet';

CashinTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/cashin.jade')();
};

CashinTab.prototype.angular = function (module)
{
  module.controller('CashinCtrl', ['$scope', '$rootScope', 'rpId', 'rpNetwork', 'rpZipzap', 'rpTracker',
  function ($scope, $rootScope, $id, $network, $zipzap, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.form = {};

    // TODO request results should be stored in blob
    $scope.$watch('address',function(address){
      if (!$rootScope.zipzap && address) {
        var account = $network.remote.account(address);

        // Get ZipZap account
        if ($scope.userBlob.data.zipzap && !$.isEmptyObject($scope.userBlob.data.zipzap)) {
          account.line('USD','rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',function(err,line){
            $scope.$apply(function () {
              $scope.mode = line && line.limit > 0 ? 'details' : 'step2';
              $scope.zipzap = $scope.userBlob.data.zipzap;
              $scope.loading = false;
            })
          });
        }
        else {
          $scope.mode = 'step1';
        }
      }
    });

    // TODO ability to edit account details
    $scope.signup = function() {
      $scope.signupProgress = 'loading';

      // Create zipzap account, fund the ripple wallet
      $zipzap.register($id.account,$scope.form);
      $zipzap.request(function(response){
        var account = $network.remote.account($scope.address);

        $scope.signupProgress = false;
        if (response.ZipZapAcctNum) {
          // Add ZipZap account to user blob
          $scope.userBlob.data.zipzap = response;

          // Check trust to SnapSwap
          account.line('USD','rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',function(err,line){
            $scope.$apply(function () {
              $scope.displaySignupForm = false;
              $scope.mode = line && line.limit > 0 ? 'details' : 'step2';
              $scope.zipzap = response;
              $scope.loading = false;
            })
          });

          $rpTracker.track('ZipZap register', {
            'Status': 'success'
          });
        } else {
          $scope.$apply(function () {
            if (response && response.Message) {
              $scope.error = {
                'code': response.Code,
                'message': response.Message,
                'verboseMessage': response.VerboseMessage
              };

              $rpTracker.track('ZipZap register', {
                'Status': 'error',
                'Message': response.VerboseMessage
              });
            } else {
              $scope.error = {
                'code': null,
                'message': 'Invalid form',
                'verboseMessage': 'Form is invalid, please make sure entered information is correct'
              };

              $rpTracker.track('ZipZap register', {
                'Status': 'error',
                'Message': 'Form is invalid'
              });
            }
          });
        }
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

          if (!response.PayCenters || (response.PayCenters && !response.PayCenters.length)) {
            $scope.locateStatus = 'notfound';

            $rpTracker.track('ZipZap locate payment center', {
              'Status': 'success'
            });
          } else {
            $rpTracker.track('ZipZap locate payment center', {
              'Status': 'notfound'
            });
          }
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

module.exports = CashinTab;
