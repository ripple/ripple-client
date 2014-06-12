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
    var updateProfile = function() {
      var blob = $scope.userBlob;
      if (blob && typeof(blob.identity) !== 'undefined') {
        var key = blob.key;

        var profile = blob.identity.getAll(key);

        // Normalize profile
        for (var key in profile) {
          profile[key] = profile[key].value;
        }
        $scope.profile = profile;
      }
    }

    $scope.profile = {};
    $scope.profile.entityType = 'individual';

    $scope.$watch('userBlob', function(){
      updateProfile();
    });

    if ($scope.userBlob) {
      updateProfile();
    };

    var genNum = function(start, end) {
      var arr = [];
      for (var i = start; i <= end; i++) {
        arr.push('' + i);
      }
      return arr;
    }

    $scope.days = genNum(1, 31);
    $scope.months = ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June', '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'];
    var currentYear = new Date().getFullYear();
    $scope.years = genNum(currentYear - 100, currentYear);

    var id_type_dictionary = {
      'Social Security Number': 'ssn',
      'National ID Number': 'other',
      'Passport Number': 'passport',
      'Drivers License Number': 'driversLicense'
    };
    $scope.id_types = Object.keys(id_type_dictionary);

    $scope.save = function () {
      var blob = $scope.userBlob;
      var key = blob.key;

      var profile = $scope.profile;


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

      // NationalID
      var nationalID;
      if ($scope.profile.entityType === 'individual') {
        nationalID = $scope.profile.nationalID;
      }
      else {
        // corporation
        nationalID = {
          number: $scope.profile.nationalID.taxID,
          type: 'taxID',
          country: $scope.profile.address.country
        };
      }

      blob.identity.set('nationalID', key, nationalID, function(err, resp) {
        //console.log('here', err, resp);
        //console.log(blob.identity.getAll(key));
      });

      console.log('Saved profile');
    };

  }]);
};

module.exports = KycTab;
