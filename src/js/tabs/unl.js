var util = require('util');
var Tab = require('../client/tabmanager').Tab;

var UNLTab = function ()
{
  Tab.call(this);
};

util.inherits(UNLTab, Tab);
UNLTab.prototype.parent = 'advanced';

UNLTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/unl.jade')();
};

UNLTab.prototype.angular = function (module) 
{
  module.controller('UNLCtrl', ['$scope', function ($scope)
  {
    $scope.addressbookmaster = angular.copy($scope.addressbook);

    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;
    };

    $scope.add = function ()
    {
      $scope.addressbook.push({
        name: $scope.name,
        address: $scope.address
      });
    };

    $scope.edit = function (index)
    {
      $scope.addressbook[index].isEditMode = true;
    };

    $scope.update = function (index)
    {
      $scope.addressbookmaster[index] = {
        name: $scope.addressbook[index].name,
        address: $scope.addressbook[index].address
      };

      $scope.addressbook[index].isEditMode = false;
    };

    $scope.remove = function (index) {
      $scope.addressbook.splice(index,1);
    };

    $scope.cancel = function (index)
    {
      $scope.addressbook[index] = {
        name: $scope.addressbookmaster[index].name,
        address: $scope.addressbookmaster[index].address
      };

      $scope.addressbook[index].isEditMode = false;
    };
  }]);
};

module.exports = UNLTab;
