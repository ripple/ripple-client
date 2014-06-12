var util = require('util');
var Tab = require('../client/tab').Tab;

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
  module.controller('KycCtrl', ['$scope',
                                    function ($scope)
  {
    $scope.days = genNum(1, 31);
    $scope.months = ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June', '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'];
    var currentYear = new Date().getFullYear();
    $scope.years = genNum(currentYear - 100, currentYear);

    var id_type_map = {
      'Social Security Number': 'ssn',
      'National ID Number': 'other',
      'Passport Number': 'passport',
      'Drivers License Number': 'driversLicense',
      'Tax ID': 'taxID'
    };
    var id_type_map_reverse = reverseDictionary(id_type_map);
    $scope.id_types = Object.keys(id_type_map);


    var updateProfile = function() {
      var blob = $scope.userBlob;
      if (blob && typeof(blob.identity) !== 'undefined') {
        var key = blob.key;

        var profile = blob.identity.getAll(key);

        // Normalize profile
        for (var key in profile) {
          profile[key] = profile[key].value;
        }

        if (profile.entityType === 'corporation') {
          profile.nationalID.taxID = profile.nationalID.number;
        }

        var type = profile.nationalID.type;
        var type_short = id_type_map_reverse[type];
        profile.nationalID.type =  type_short ? type_short: type;

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
    };

    $scope.save = function () {
      var blob = $scope.userBlob;
      var key = blob.key;

      blob.identity.set('name', key, $scope.profile.name, function(err, resp) {
        //console.log('here', err, resp);
        //console.log(blob.identity.getAll(key));
      });

      blob.identity.set('address', key, $scope.profile.address, function(err, resp) {
        //console.log('here', err, resp);
        //console.log(blob.identity.getAll(key));
      });

      blob.identity.set('entityType', key, $scope.profile.entityType, function(err, resp) {
        //console.log('here', err, resp);
        //console.log(blob.identity.getAll(key));
      });

      blob.identity.set('birthday', key, $scope.profile.birthday, function(err, resp) {
        console.log('here', err, resp);
        console.log(blob.identity.getAll(key));
      });

      // NationalID
      var national_id = {};
      var nid = $scope.profile.nationalID;
      if ($scope.profile.entityType === 'individual') {
        national_id.number = nid.number;
        national_id.type = id_type_map[nid.type] ? id_type_map[nid.type]: 'other';
        national_id.country = nid.country;
      }
      else {
        // corporation
        national_id.number = nid.taxID;
        national_id.type = 'taxID';
        national_id.country = $scope.profile.address.country;
      }

      blob.identity.set('nationalID', key, national_id, function(err, resp) {
        //console.log('here', err, resp);
        //console.log(blob.identity.getAll(key));
      });

      console.log('Saved profile');
    };

  }]);
};

module.exports = KycTab;
