/**
 * Profile
 *
 * The profile service is used for storing KYC information.
 */


var module = angular.module('profile', []);

module.factory('rpProfile', ['$rootScope',
                        function($scope)
{
  var id_type_map_individual = {
    'Social Security Number': 'ssn',
    'Passport Number': 'passport',
    'Drivers License Number': 'driversLicense',
    'National ID Number': 'other',                  // TODO: Add National ID Number to ripple-lib blob types
    'Other': 'other'
  };

  var id_type_map_organization = {
    'Tax ID': 'taxID',
    'Other': 'other'
  };

  function reverseDictionary(dict) {
    var result = {};
    for (var key in dict) {
      result[dict[key]] = key;
    }
    return result;
  }

  function genNum(start, end) {
    var arr = [];
    for (var i = start; i <= end; i++) {
      arr.push('' + i);
    }
    return arr;
  }


  var setBirthdayScope = function () {
    $scope.days = genNum(1, 31);
    $scope.months = ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June', '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'];
    var currentYear = new Date().getFullYear();
    $scope.years = genNum(currentYear - 100, currentYear);
  }

  var setNationalIDScope = function () {
    if ($scope.profile) {
      if ($scope.profile.entityType === 'individual') {
        $scope.id_types = Object.keys(id_type_map_individual);
      }
      else {
        $scope.id_types = Object.keys(id_type_map_organization);
      }
    }
  }

  var updateProfileScope = function () {
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
        var id_type_map_individual_reverse = reverseDictionary(id_type_map_individual);
        type_short = id_type_map_individual_reverse[type];
        profile.nationalID.type =  type_short ? type_short: type;
      }
      else {
        var id_type_map_organization_reverse = reverseDictionary(id_type_map_organization);
        type_short = id_type_map_organization_reverse[type];
        profile.nationalID.type =  type_short ? type_short: type;
      }

      $scope.profile = profile;
    }
  }

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

  return {
    updateProfileScope: updateProfileScope,
    setBirthdayScope: setBirthdayScope,
    setNationalIDScope: setNationalIDScope,
    saveName: saveName,
    saveAddress: saveAddress,
    saveEntityType: saveEntityType,
    saveNationalID: saveNationalID,
    saveBirthday: saveBirthday
  }
}]);







