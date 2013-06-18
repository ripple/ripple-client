var util      = require('util');
var webutil   = require('../util/web');
var Tab       = require('../client/tab').Tab;

var InviteTab = function ()
{
  Tab.call(this);
};

util.inherits(InviteTab, Tab);

InviteTab.prototype.mainMenu = 'wallet';

InviteTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/invite.jade')();
};

InviteTab.prototype.angular = function (module) {
  module.controller('InviteCtrl', ['$scope', 'rpId',
    function ($scope, $id)
    {
      if (!$id.loginStatus) return $id.goId();

      
    }]);
};

module.exports = InviteTab;
