'use strict';

var util = require('util');
var Tab = require('../client/tab').Tab;

var AccountTab = function() {
  Tab.call(this);
};

util.inherits(AccountTab, Tab);

AccountTab.prototype.tabName = 'account';
AccountTab.prototype.mainMenu = 'account';

AccountTab.prototype.extraRoutes = [
  {name: '/account/:route'}
];

AccountTab.prototype.angular = function(module) {
  module.controller('AccountCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {
      if (!$routeParams.route) {
        $routeParams.route = 'public';
      }
    }]
  );
};

module.exports = AccountTab;
