var util      = require('util');
var Tab       = require('../client/tabmanager').Tab;
var id        = require('../client/id').Id.singleton;

var ContactsTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(ContactsTab, Tab);

ContactsTab.prototype.parent = 'account';

ContactsTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/contacts.jade')();
};

ContactsTab.prototype.angularDeps = ['directives'];

ContactsTab.prototype.angular = function (module) {
  var app = this.app;

  module.controller('ContactsCtrl', function ($scope)
  {
    $scope.addressbookmaster = [];
    $scope.addressbook = [];
    $scope.name = '';
    $scope.address = '';

    $scope.updateData = function ()
    {
      $scope.addressbook = app.id.getContacts();
      $scope.addressbookmaster = angular.copy($scope.addressbook);
      $scope.$digest();
    }

    // Update contacts when user enters this tab
    if (app.id.data) {
      $scope.updateData();
    }

    // Update contacts when blob is updated
    app.id.on('blobupdate', function (e) {
      $scope.updateData();
    })

    /**
     * Toggle "add contact" form
     */
    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;
    }

    /**
     * Create contact
     */
    $scope.create = function ()
    {
      var contact = {
        name: $scope.name,
        address: $scope.address
      };

      // Add an element
      $scope.addressbook.unshift(contact);

      // Update master
      $scope.addressbookmaster.unshift(contact);

      // Update blob
      app.id.setContacts($scope.addressbookmaster);

      // Clear form
      $scope.name = '';
      $scope.address = '';
    }

    /**
     * Switch to edit mode
     *
     * @param index
     */
    $scope.edit = function (index)
    {
      $scope.addressbook[index].isEditMode = true;
    }

    /**
     * Update contact
     *
     * @param index
     */
    $scope.update = function (index)
    {
      $scope.addressbook[index].duplicateName = false;
      $scope.addressbook[index].duplicateAddress = false;

      // TODO use "unique" directive
      for (var i = 0; i < $scope.addressbookmaster.length; i++) {
        if (i!=index && $scope.addressbookmaster[i].name == $scope.addressbook[index].name) {
          $scope.addressbook[index].duplicateName = true;
        }
        if (i!=index && $scope.addressbookmaster[i].address == $scope.addressbook[index].address) {
          $scope.addressbook[index].duplicateAddress = true;
        }
        if ($scope.addressbook[index].duplicateName || $scope.addressbook[index].duplicateAddress) {
          return;
        }
      }

      $scope.addressbook[index].isEditMode = false;

      // Update master
      $scope.addressbookmaster[index] = $scope.addressbook[index];

      // Update blob
      app.id.setContacts($scope.addressbookmaster);
    }

    /**
     * Remove contact
     *
     * @param index
     */
    $scope.remove = function (index) {
      $scope.addressbook.splice(index,1);

      // Update master
      $scope.addressbookmaster.splice(index,1);

      // Update blob
      app.id.setContacts($scope.addressbookmaster);
    }

    /**
     * Cancel contact edit
     *
     * @param index
     */
    $scope.cancel = function (index)
    {
      $scope.addressbook[index] = {
        name: $scope.addressbookmaster[index].name,
        address: $scope.addressbookmaster[index].address,
        isEditMode: false
      };
    }
  })

  /**
   * Contact name and address uniqueness validator
   */
  module.directive('unique', function() {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function ($scope, elm, attr, ctrl) {
        if (!ctrl) return;

        var validator = function(value) {
          var duplicates = $.grep($scope.addressbook, function(e){ return e[elm[0].name] == value; })

          if (duplicates.length === 0) {
            ctrl.$setValidity('unique', true);
            return value;
          } else {
            ctrl.$setValidity('unique', false);
            return;
          }
        }

        ctrl.$formatters.push(validator);
        ctrl.$parsers.unshift(validator);

        attr.$observe('unique', function() {
          validator(ctrl.$viewValue);
        });
      }
    };
  })
};

ContactsTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('button.send').click(function () {
    self.tm.gotoTab('send');
  });
};

module.exports = ContactsTab;
