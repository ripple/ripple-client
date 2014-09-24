var util = require('util');
var Tab = require('../client/tab').Tab;

var KycTab = function ()
{
  Tab.call(this);
};

util.inherits(KycTab, Tab);

KycTab.prototype.tabName = 'kyc';
KycTab.prototype.mainMenu = 'kyc';

KycTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/kyc.jade')();
};

KycTab.prototype.angular = function(module)
{
  module.controller('KycCtrl', ['$scope', 'rpId', 'rpKeychain', 'rpAuthFlow', '$timeout',
    function ($scope, $id, keychain, authflow, $timeout)
    {
      if (!$id.loginStatus) return $id.goId();
      if (!$scope.blockscoreError) $scope.blockscoreError = false;
      if (!$scope.profile) $scope.profile = {};
      if (!$scope.kyc) $scope.kyc = {};

      $scope.load_notification = function(status) {
        if (typeof status !== 'string') {
          console.log("You must pass in a string for the status");
          return;
        }

        $scope.kyc.notif = status;

        $timeout(function() {
          $scope.kyc.notif = 'clear';
        }, 10000);
      }

      $scope.load_notification('checking_step');

      $scope.$on('$blobUpdate', onBlobUpdate);
      onBlobUpdate();

      function onBlobUpdate()
      {
        if ("function" === typeof $scope.userBlob.encrypt) {
          $scope.enc = $scope.userBlob.encrypt();
        }
        
        $scope.requirePassword = !$scope.userBlob.data.persistUnlock;
        
        if (!$scope.loaded2FA && "function" === typeof $scope.userBlob.get2FA) {
          $scope.userBlob.get2FA(function(err, resp) {
            $scope.$apply(function(){
              if (err) {
                console.log('Error: ', err);
                return;
              }

              $scope.enabled2FA = resp.enabled;
              $scope.phoneNumber = resp.phone;
              $scope.countryCode = resp.country_code;
            });
          });
        }

        // Check what step user is on - they may have partially gone through KYC flow
        if ($scope.userBlob.id) {

          $scope.options = {
            url         : $scope.userBlob.url,
            auth_secret : $scope.userBlob.data.auth_secret,
            blob_id     : $scope.userBlob.id
          }

          authflow.getAttestationSummary($scope.options, function(err, resp) {

            if (err) {
              console.log('Error on getAttestationSummary');
              return;
            }

            if (resp.decoded.payload.profile_verified === true && resp.decoded.payload.identity_verified === true) {

              $scope.currentStep = 'three';
            }

            else if (resp.decoded.payload.profile_verified === true && resp.decoded.payload.identity_verified === false) {
              $scope.options.type = 'identity';

              $scope.getQuestions($scope.options, function() {
                $scope.currentStep = 'two';
              });
            }

            else if (resp.decoded.payload.profile_verified === false && resp.decoded.payload.identity_verified === false) {
              $scope.currentStep = 'one';
            }

            else {
              console.log('Error: KYC flow route not recognized');
            }

            $scope.kyc.notif = 'clear';
          });
        }
      }

      // STEP ONE: IDENTITY INFORMATION

      //$scope.validation_pattern_name = /^[a-zA-Z0-9]{1,}$/;
      $scope.validation_pattern_date = /^(0[1-9]|[12]\d|3[0-1])$/;
      $scope.validation_pattern_month = /^(0[1-9]|1[0-2])$/;
      $scope.validation_pattern_year = /^[0-9]{4}$/;
      $scope.validation_pattern_city = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;
      $scope.validation_pattern_state = /^[a-zA-Z][a-zA-Z]$/;
      $scope.validation_pattern_zip = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
      $scope.validation_pattern_sss = /^[0-9]{4}$/;

      var genNum = function(start, end) {
        var arr = [];
        for (var i = start; i <= end; i++) {
          arr.push('' + i);
        }
        return arr;
      }

      var currentYear = new Date().getFullYear();

      $scope.years = genNum(currentYear - 100, currentYear);

      $scope.dates = 
        ['01','02', '03', '04', '05', '06', '07', '08', '09', '10',
         '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
         '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'];

      $scope.months =
        ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

      $scope.saveIdentityInfo = function () {
        $scope.load_notification('verifying');

        var parsedBirthdate = ''.concat($scope.profile.birthdate.year)
          .concat('-')
          .concat($scope.profile.birthdate.month)
          .concat('-')
          .concat($scope.profile.birthdate.date);

        // US only for now
        $scope.profile.address.country = 'US';

        $scope.options.type = 'profile';
       
        $scope.options.profile = {
          name : {
            given  : $scope.profile.name.given,
            family : $scope.profile.name.family
          },
          ssn_last_4 : $scope.profile.ssn_last_4,
          birthdate  : parsedBirthdate,
          address  : {
            line1       : $scope.profile.address.line1,
            locality    : $scope.profile.address.locality,
            region      : $scope.profile.address.region,
            postal_code : $scope.profile.address.postal_code,
            country     : $scope.profile.address.country
          }
        }

        authflow.updateAttestation($scope.options, function(err, res) {
          if (err) {
            console.log("Error in saveIdentityInfo: ", err);
            $scope.load_notification('info_error');
            if ($scope.identityForm) $scope.identityForm.$setPristine(true);
            return;
          }

          if (res.status === "unverified") {
            $scope.load_notification('info_error');
            if ($scope.identityForm) $scope.identityForm.$setPristine(true);
          }

          else {
            $scope.load_notification('info_verified');
            $scope.options.type = 'identity';

            // Retrieve questions from BlockScore after successfully identifying user
            $scope.getQuestions($scope.options, function() {
              $scope.currentStep = 'two';
            });
          } 
        });
      }

      // STEP TWO: IDENTITY QUESTIONS

      $scope.getQuestions = function(options, cb) {

        authflow.updateAttestation(options, function(err, res) {
          if (err) {
            console.log("Error in retrieving questions: ", err);
            $scope.blockscoreError = true;
            return;
          } else {
            $scope.questions = res.questions;
          }

          cb();
        });
      }


      $scope.saveQuestions = function() {
        $scope.load_notification('verifying');

        $scope.options.answers = [];
        $scope.options.type = 'identity';

        _.each($scope.questions, function(question) {
          $scope.options.answers.push({ question_id : question.id, answer_id : Number(question.answerId) });
        });


        authflow.updateAttestation($scope.options, function(err, res) {
          if (err) {
            console.log("Error in saveQuestions: ", err);
            $scope.load_notification('questions_error');
            if ($scope.identityForm) $scope.identityForm.$setPristine(true);
            return;
          }

          if (res.status === "unverified") {
            $scope.load_notification('questions_error');
            if ($scope.questionsForm) $scope.questionsForm.$setPristine(true);
          } else {
            $scope.load_notification('questions_verified');
            $scope.currentStep = 'three';  
          } 
        });
      }

      // STEP THREE: TWO FACTOR AUTH


      window.Authy.UI.instance(true, $scope.countryCode);
      
    }]
  );
};

module.exports = KycTab;
