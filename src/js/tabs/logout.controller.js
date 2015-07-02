'use strict';

var util = require('util');
var Tab = require('../client/tab').Tab;

var LogoutTab = function() {
  Tab.call(this);
};

util.inherits(LogoutTab, Tab);

LogoutTab.prototype.tabName = 'logout';
LogoutTab.prototype.pageMode = 'single';
LogoutTab.prototype.parent = 'main';

LogoutTab.prototype.angular = function(module) {
  module.controller('LogoutCtrl', ['$scope', '$location',
    function($scope, $location) {
      var redirect_to = $location.search().redirect_to ? decodeURI($location.search().redirect_to) : null;

      $scope.logout(redirect_to);
    }]
  );
};

module.exports = LogoutTab;
