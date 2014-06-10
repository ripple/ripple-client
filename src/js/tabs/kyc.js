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
  module.controller('KycCtrl', ['$scope', '$rootScope', 'rpId', '$timeout',
                                    function ($scope, $rootScope, $id, $timeout)
  {

    $scope.save = function () {
      console.log(JSON.stringify($scope.profile));
    };

  }]);
};

module.exports = KycTab;
