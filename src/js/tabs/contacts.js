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
  module.controller('ContactsCtrl', function ($scope)
  {
    $scope.addressbook = [{
        name: 'Bob',
        address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
      },{
        name: 'Bob',
        address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
      },{
        name: 'Bob',
        address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
      },{
        name: 'Bob',
        address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
      },{
        name: 'Bob',
        address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
      },{
        name: 'Bob',
        address: 'rwcQbuaLBUgS9ySP1v9x2WfyBWC9xBARRV'
    }];

    $scope.show_form = function ()
    {
      $scope.addform_visible = true;
    };

    $scope.isEditMode = false;

    $scope.add = function ()
    {
      $scope.addressbook.push({
        name: $scope.name,
        address: $scope.address
      });
    };

    $scope.remove = function (index) {
      $scope.addressbook.splice(index,1);
    }
  });
};

ContactsTab.prototype.onAfterRender = function ()
{
  var self = this;
  this.el.find('button.send').click(function () {
    self.tm.gotoTab('send');
  });
};

module.exports = ContactsTab;
