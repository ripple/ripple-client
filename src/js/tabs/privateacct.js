var util = require('util'),
    Tab = require('../client/tab').Tab;

var PrivateAcctTab = function ()
{
  Tab.call(this);
};

util.inherits(PrivateAcctTab, Tab);

PrivateAcctTab.prototype.tabName = 'privateacct';
PrivateAcctTab.prototype.mainMenu = 'privateacct';

PrivateAcctTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

PrivateAcctTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/privateacct.jade')();
};

PrivateAcctTab.prototype.angular = function (module)
{
  module.controller('PrivateAcctCtrl', ['$scope', '$rootScope', 'rpId',
    function ($scope, $rootScope, $id) {
      var name = $scope.firstName;

      if (!$id.loginStatus) return $id.goId();

      //$scope.validation_pattern_name = /^[a-zA-Z0-9]{1,}$/;
      $scope.validation_pattern_day = /^([1-9]|[12]\d|3[0-1])$/;
      //$scope.validation_pattern_month = /^(0[1-9]|1[0-2])$/;
      $scope.validation_pattern_year = /^[0-9]{4}$/;
      $scope.validation_pattern_city = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;
      $scope.validation_pattern_state = /^[a-zA-Z\s]*$/;
      $scope.validation_pattern_zip = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
      $scope.validation_pattern_sss = /^[0-9]{4}$/;

      $scope.save = function () {
        var profile = $scope.profile;
        console.log(profile);
        console.log($scope.profile.name);
      }

      var genNum = function(start, end) {
        var arr = [];
        for (var i = start; i <= end; i++) {
          arr.push('' + i);
        }
        return arr;
      }

      $scope.days = genNum(1, 31);
      $scope.months = ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June',
        '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'];
      var currentYear = new Date().getFullYear();
      $scope.years = genNum(currentYear - 100, currentYear);

    }]);
};

module.exports = PrivateAcctTab;