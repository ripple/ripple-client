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
      if (!$scope.currentStep) $scope.currentStep = 'three';
      if (!$scope.blockscoreError) $scope.blockscoreError = false;
      if (!$scope.profile) $scope.profile = {};
      if (!$scope.kyc) $scope.kyc = {};

      console.log('currentStep', $scope.currentStep);

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

      // $scope.states =
      //   ['AK', 'AL', 'AR', 'AS', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA',
      //    'GU', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'LA', 'MA', 'MD', 'ME', 'MH',
      //    'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV',
      //    'NY', 'OH', 'OK', 'OR', 'PA', 'PW', 'RI', 'SC', 'SD', 'TN', 'UT', 'VA',
      //    'VI', 'VT', 'WA', 'WI', 'WV', 'WY'];

      $scope.saveIdentityInfo = function () {
        $scope.load_notification('verifying');

        var parsedBirthdate = ''.concat($scope.profile.birthdate.year)
          .concat('-')
          .concat($scope.profile.birthdate.month)
          .concat('-')
          .concat($scope.profile.birthdate.date);

        // US only for now
        $scope.profile.address.country = 'US';

        // Required for BlockScore API attestation
        var options = {
          url         : $scope.userBlob.url,
          auth_secret : $scope.userBlob.data.auth_secret,
          blob_id     : $scope.userBlob.id
        }

        options.type = 'profile';
       
        options.profile = {
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

        authflow.createAttestation(options, function(err, res) {

          console.log('profile being submitted: ', options.profile);

          if (err) {
            console.log("Error in saveIdentityInfo: ", err);
            $scope.load_notification('info_error');
            if ($scope.identityForm) $scope.identityForm.$setPristine(true);
            return;
          }

          if (res.status === "invalid") {
            $scope.load_notification('info_error');
            if ($scope.identityForm) $scope.identityForm.$setPristine(true);
          } else {

            $scope.load_notification('info_verified');

            options.type = 'identity';

            // Retrieve questions from BlockScore after successfully identifying user
            authflow.createAttestation(options, function(err, res) {
              if (err) {
                console.log("Error in retrieving questions: ", err);
                $scope.blockscoreError = true;
                return;
              } else {

                $scope.currentStep = 'two';

                console.log('res from retrieving questions is: ', res);
                                
                $scope.questions = res.questions;
              }
            });
          } 
        });
      }

      // STEP TWO: SECURITY QUESTIONS

      // FOR TESTING ONLY
      // var sampleData = {"result":"success","status":"unverified","attestation":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2lkLnJpcHBsZS5jb20iLCJzdWIiOiIyOTY0MDYwNC1mOGE5LTQ0ZGEtOGJlNS0xYWUwNTA3YzE4MGEiLCJleHAiOjE0MTAzOTA1NzYsImlhdCI6MTQxMDM4ODcxNn0.cWnzu3ePM0Qg53U/MFq08Fjo9qzGimg1LYSHwrHhelWS3A+uztdpDnThp110rYCKsz4Kzvmhe1Vtf7ibo86aqM8KPqrT3PyMpq7ISW94VWsQOZT/tABsh5wL1MgE+IdehUU33fSTngDR7nI9lzLurZwzI4tYuENpi5ZlLni1epUoLmxezgnMHmRxvqV9orzG4yIHcJxuN7xElNMewUTH/TwwexPdypDSuYFCymuWfqTFKQ6rm6ZIqYknJX4l4eh6rbq5qHLNOwR2SIQmd+bJ7HFVIq6kfOpno8SM38OiJfrtl9/LuclywGkKGUfHfJWiNt6JYT28XN/0TyoQKN7wXg==","questions":[{"id":1,"question":"Which one of the following addresses is associated with you?","answers":[{"id":1,"answer":"430 Dwight"},{"id":2,"answer":"309 Colver Rd"},{"id":3,"answer":"123 Main St"},{"id":4,"answer":"467 Meridian Rd"},{"id":5,"answer":"None Of The Above"}]},{"id":2,"question":"Which one of the following adult individuals is most closely associated with you?","answers":[{"id":1,"answer":"Luis"},{"id":2,"answer":"Cecilia"},{"id":3,"answer":"Jose"},{"id":4,"answer":"Miranda"},{"id":5,"answer":"None Of The Above"}]},{"id":3,"question":"Which one of the following zip codes is associated with you?","answers":[{"id":1,"answer":"49993"},{"id":2,"answer":"49557"},{"id":3,"answer":"49184"},{"id":4,"answer":"49230"},{"id":5,"answer":"None Of The Above"}]},{"id":4,"question":"Which one of the following counties is associated with you?","answers":[{"id":1,"answer":"Jasper"},{"id":2,"answer":"Niagara"},{"id":3,"answer":"Floyd"},{"id":4,"answer":"Sangamon"},{"id":5,"answer":"None Of The Above"}]},{"id":5,"question":"What state was your SSN issued in?","answers":[{"id":1,"answer":"Utah"},{"id":2,"answer":"Delaware"},{"id":3,"answer":"New Hampshire"},{"id":4,"answer":"Idaho"},{"id":5,"answer":"None Of The Above"}]}]};
      // $scope.questions = sampleData.questions;


      $scope.saveQuestions = function() {
        $scope.load_notification('verifying');

        var options = {
          url         : $scope.userBlob.url,
          auth_secret : $scope.userBlob.data.auth_secret,
          blob_id     : $scope.userBlob.id
        }

        options.answers = [];
        options.type = 'identity';

        _.each($scope.questions, function(question) {
          options.answers.push({ question_id : question.id, answer_id : Number(question.answerId) });
        });


        authflow.createAttestation(options, function(err, res) {

          console.log('answers being submitted: ', options.answers);

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
      }

      window.Authy.UI.instance(true, $scope.countryCode);
      
    }]
  );
};

module.exports = KycTab;
