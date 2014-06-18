var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function ()
{
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'advanced';

AccountTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/account.jade')();
};

AccountTab.prototype.angular = function(module)
{
  module.controller('AccountCtrl', ['$scope', 'rpId', 'rpKeychain',
    function ($scope, $id, keychain)
    {
      if (!$id.loginStatus) return $id.goId();

      $scope.rename = function() {
        $scope.loading = true;
        $scope.error = false;

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
      };

      var reset = function() {
        $scope.openForm = false;
        $scope.username = '';
        $scope.password = '';
        $scope.showPassword = true;
        $scope.success = false;
        $scope.loading = false;
        $scope.error = false;

        if ($scope.renameForm) {
          $scope.renameForm.$setPristine(true);
        }
      };

      reset();

      // Profile information
      function updateProfile() {
        var blob = $scope.userBlob;
        if (blob && typeof(blob.identity) !== 'undefined') {
          var key = blob.key;

          var profile = $scope.userBlob.identity.getAll(key);

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

      function reverseDictionary(dict) {
        var result = {};
        for (var key in dict) {
          result[dict[key]] = key;
        }
        return result;
      }

      $scope.$watch('userBlob', function(){
        updateProfile();
      });

      if ($scope.userBlob) {
        updateProfile();
      }

      $scope.saveName = function () {
        $scope.userBlob.identity.set('name', $scope.userBlob.key, $scope.profile.name, function (err, result) {
          $scope.$apply(function () {
            $scope.editName = false;
            updateProfile();

            if (err) {
              console.log('Could not update name');

              $scope.failedProfileName = true;
            }
            else {
              console.log('New name saved');

              $scope.successProfileName = true;
            }
          });
        });
      }

      $scope.saveAddress = function (callback) {
        $scope.userBlob.identity.set('address', $scope.userBlob.key, $scope.profile.address, function (err, result) {
          $scope.$apply(function () {
            $scope.editAddress = false;
            updateProfile();

            if (err) {
              console.log('Could not update address');

              $scope.failedProfileAddress = true;
            }
            else {
              console.log('New address saved');

              $scope.successProfileAddress = true;
            }
          });
        });
      }

      var id_type_map_individual = {
        'Social Security Number': 'ssn',
        'Passport Number': 'passport',
        'Drivers License Number': 'driversLicense',
        'National ID Number': 'other',                  // TODO: Add National ID Number to ripple-lib blob types
        'Other': 'other'
      };
      var id_type_map_individual_reverse = reverseDictionary(id_type_map_individual);
      var id_type_map_organization = {
        'Tax ID': 'taxID',
        'Other': 'other'
      };
      var id_type_map_organization_reverse = reverseDictionary(id_type_map_organization);

      $scope.saveID = function (callback) {
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

        $scope.userBlob.identity.set('nationalID', $scope.userBlob.key, national_id, function (err, result) {
          $scope.$apply(function () {
            $scope.editID = false;
            updateProfile();

            if (err) {
              console.log('Could not update ID');

              $scope.failedProfileID = true;
            }
            else {
              console.log('New ID saved');

              $scope.successProfileID = true;
            }
          });
        });
      }
    }]
  );
};

module.exports = AccountTab;



