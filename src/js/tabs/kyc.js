var util = require('util');
var Tab = require('../client/tab').Tab;
var async = require('async');

var KycTab = function ()
{
  Tab.call(this);
};

util.inherits(KycTab, Tab);

KycTab.prototype.tabName = 'kyc';
//KycTab.prototype.mainMenu = 'advanced';

KycTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/kyc.jade')();
};

KycTab.prototype.angular = function(module)
{
  module.controller('KycCtrl', ['$scope', '$rootScope', '$location', 'rpProfile',
                                    function ($scope, $rootScope, $location, rpProfile)
  {
    $scope.profile = {};
    $scope.profile.entityType = 'individual'; // Default to individual

    rpProfile.setBirthdayScope();


    $scope.$watch('userBlob', function(){
      rpProfile.updateProfileScope();
      $scope.profile = $rootScope.profile;
    });

    if ($scope.userBlob) {
      rpProfile.updateProfileScope();
      $scope.profile = $rootScope.profile;
    }

    var updateShowNoSSN = function() {
      if ($scope.profile.nationalID &&
        $scope.profile.nationalID.type !== 'Social Security Number' &&
        $scope.profile.nationalID.country === 'USA') {
        $scope.show_no_ssn = true;
      }
      else {
        $scope.show_no_ssn = false;
      }
    }

    var updateShowIssuingCountry = function () {
      if ($scope.profile.nationalID &&
        $scope.profile.nationalID.type !== 'Social Security Number') {
        $scope.show_issuing_country = true;
      }
      else {
        $scope.show_issuing_country = false;
      }
    }

    $scope.$watch('profile.nationalID.type', function(){
      updateShowNoSSN();
      updateShowIssuingCountry();
    });

    $scope.$watch('profile.nationalID.country', function(){
      updateShowNoSSN();
    });

    $scope.$watch('profile.entityType', function(){
      rpProfile.setNationalIDScope();
    });

    $scope.save = function () {
      async.parallel([rpProfile.saveName, rpProfile.saveAddress, rpProfile.saveEntityType, rpProfile.saveNationalID, rpProfile.saveBirthday], function (err, results) {
        if (err) {
          console.log('Error saving profile: ', err);

          $scope.$apply(function () {
            $scope.failed = true;
            $scope.success = false;
          });
        }
        else {
          console.log('Successfully saved profile: ', results);

          $scope.$apply(function () {
            $scope.failed = false;
            $scope.success = true;

            // Redirect back to original referer
            if ($rootScope.redirectURL) {
              $location.path($rootScope.redirectURL);
            }
          });
        }
      });
    };

    $scope.cancel = function () {
      // Redirect back to original referer
      if ($rootScope.redirectURL) {
        $location.path($rootScope.redirectURL);
      }
    };

  }]);
};

module.exports = KycTab;
