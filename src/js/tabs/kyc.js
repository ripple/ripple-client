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
  module.controller('KycCtrl', ['$scope', '$rootScope',
                                    function ($scope, $rootScope)
  {
    $scope.days = genNum(1, 31);
    $scope.months = ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June', '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'];
    var currentYear = new Date().getFullYear();
    $scope.years = genNum(currentYear - 100, currentYear);

    var id_type_map_individual = {
      'Social Security Number': 'ssn',
      'Passport Number': 'passport',
      'Drivers License Number': 'driversLicense',
      'National ID Number': 'other',
      'Other': 'other'
    };
    var id_type_map_individual_reverse = reverseDictionary(id_type_map_individual);
    var id_type_map_organization = {
      'Tax ID': 'taxID',
      'Other': 'other'
    };
    var id_type_map_organization_reverse = reverseDictionary(id_type_map_organization);


    var updateProfile = function() {
      var blob = $scope.userBlob;
      if (blob && typeof(blob.identity) !== 'undefined') {
        var key = blob.key;

        var profile = blob.identity.getAll(key);

        // Normalize profile
        for (var k in profile) {
          profile[k] = profile[k].value;
        }

        var type = profile.nationalID.type;
        var type_short;
        if (profile.entityType === 'individual') {
          type_short = id_type_map_individual_reverse[type];
          profile.nationalID.type =  type_short ? type_short: type;
        }
        else {
          type_short = id_type_map_organization_reverse[type];
          profile.nationalID.type =  type_short ? type_short: type;
        }

        $scope.profile = profile;
      }
    }

    function genNum(start, end) {
      var arr = [];
      for (var i = start; i <= end; i++) {
        arr.push('' + i);
      }
      return arr;
    }

    function reverseDictionary(dict) {
      var result = {};
      for (var key in dict) {
        result[dict[key]] = key;
      }
      return result;
    }

    $scope.profile = {};
    $scope.profile.entityType = 'individual';

    $scope.$watch('userBlob', function(){
      updateProfile();
    });

    if ($scope.userBlob) {
      updateProfile();
    }

    var updateShowNoSSN = function() {
      if ($scope.profile.nationalID.type !== 'Social Security Number' &&
        $scope.profile.nationalID.country === 'USA') {
        $scope.show_no_ssn = true;
      }
      else {
        $scope.show_no_ssn = false;
      }
    }

    var updateShowIssuingCountry = function () {
      if ($scope.profile.nationalID.type !== 'Social Security Number') {
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
      if ($scope.profile.entityType === 'individual') {
        $scope.id_types = Object.keys(id_type_map_individual);
      }
      else {
        $scope.id_types = Object.keys(id_type_map_organization);
      }
    });



    var saveName = function (callback) {
      $scope.userBlob.identity.set('name', $scope.userBlob.key, $scope.profile.name, callback);
    }

    var saveAddress = function (callback) {
      $scope.userBlob.identity.set('address', $scope.userBlob.key, $scope.profile.address, callback);
    }

    var saveEntityType = function (callback) {
      $scope.userBlob.identity.set('entityType', $scope.userBlob.key, $scope.profile.entityType, callback);
    }

    var saveNationalID = function (callback) {
      // NationalID
      var national_id = {};
      var nid = $scope.profile.nationalID;
      if ($scope.profile.entityType === 'individual') {
        national_id.number = nid.number;
        national_id.type = id_type_map_individual[nid.type] ? id_type_map_individual[nid.type]: 'other';
        national_id.country = nid.country;
      }
      else {
        // Organization
        national_id.number = nid.number;
        national_id.type = id_type_map_organization[nid.type] ? id_type_map_organization[nid.type]: 'other';
        national_id.country = $scope.profile.address.country;
      }

      $scope.userBlob.identity.set('nationalID', $scope.userBlob.key, national_id, callback);
    }

    var saveBirthday = function (callback) {
      if ($scope.profile.entityType === 'individual') {
        $scope.userBlob.identity.set('birthday', $scope.userBlob.key, $scope.profile.birthday, callback);
      }
      else {
        // Organization
        // Remove birthday
        $scope.userBlob.identity.unset('birthday', $scope.userBlob.key, callback);
      }
    }

    $scope.save = function () {
      async.parallel([saveName, saveAddress, saveEntityType, saveNationalID, saveBirthday], function (err, results) {
        if (err) {
          console.log('Error saving profile: ', err);
        }
        else {
          console.log('Successfully saved profile: ', results);
        }
      });
    };

  }]);
};

module.exports = KycTab;
