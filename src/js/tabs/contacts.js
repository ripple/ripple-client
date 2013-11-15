var util      = require('util');
var webutil   = require('../util/web');
var Tab       = require('../client/tab').Tab;

var ContactsTab = function ()
{
  Tab.call(this);
};

util.inherits(ContactsTab, Tab);

ContactsTab.prototype.mainMenu = 'wallet';

// /contact is the way it appears in Ripple URIs
ContactsTab.prototype.aliases = ['contact'];

ContactsTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/contacts.jade')();
};

ContactsTab.prototype.angular = function (module) {
  module.controller('ContactsCtrl', ['$scope', 'rpId', 'rpTracker',
    function ($scope, $id, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.reset_form = function ()
    {
      $scope.contact = {
        name: '',
        address: ''
      };
      if ($scope.addForm) $scope.addForm.$setPristine();
    };

    $scope.reset_form();

    /**
     * Toggle "add contact" form
     */
    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;
      $scope.reset_form();
    };

    /**
     * Create contact
     */
    $scope.create = function ()
    {
      var contact = {
        name: $scope.contact.name,
        address: $scope.contact.address
      };

      if ($scope.contact.dt) {
        contact.dt = $scope.contact.dt;
      }

      // Enable the animation
      $scope.enable_highlight = true;

      // Add an element
      $scope.userBlob.data.contacts.unshift(contact);

      // Hide the form
      $scope.toggle_form();

      // Clear form
      $scope.reset_form();
    };

    $rpTracker.track('Page View', {'Page Name': 'Contacts'});
  }]);

  module.controller('ContactRowCtrl', ['$scope', '$location',
    function ($scope, $location) {
      $scope.editing = false;

      /**
       * Switch to edit mode
       *
       * @param index
       */
      $scope.edit = function (index)
      {
        $scope.editing = true;
        $scope.editname = $scope.entry.name;
        $scope.editaddress = $scope.entry.address;
        $scope.editdt = $scope.entry.dt;
      };

      /**
       * Update contact
       *
       * @param index
       */
      $scope.update = function (index)
      {
        if (!$scope.inlineAddress.editaddress.$error.rpUnique
            && !$scope.inlineAddress.editaddress.$error.rpDest
            && !$scope.inlineName.editname.$error.rpUnique) {

          // Update blob
          $scope.entry.name = $scope.editname;
          $scope.entry.address = $scope.editaddress;

          if ($scope.editdt) {
            $scope.entry.dt = $scope.editdt;
          }

          $scope.editing = false;
        }
      };

      /**
       * Remove contact
       *
       * @param index
       */
      $scope.remove = function (index) {
        // Update blob
        $scope.userBlob.data.contacts.splice(index,1);
      };

      /**
       * Cancel contact edit
       *
       * @param index
       */
      $scope.cancel = function (index)
      {
        $scope.editing = false;
      };

      $scope.send = function (index)
      {
        var search = {to: $scope.entry.name};

        $location.path('/send');
        $location.search(search);
      };
    }]);
};

module.exports = ContactsTab;
