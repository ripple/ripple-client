var util = require('util');
var Tab = require('../client/tab').Tab;

var NotificationsTab = function() {
  Tab.call(this);
};

util.inherits(NotificationsTab, Tab);

NotificationsTab.prototype.tabName = 'notifications';
NotificationsTab.prototype.mainMenu = 'notifications';

NotificationsTab.prototype.generateHtml = function() {
  return require('../../jade/tabs/notifications.jade')();
};

NotificationsTab.prototype.angular = function(module) {
  module.controller('NotificationsCtrl', ['$scope', '$window', 'rpId', 'rpNotifications', function($scope, $window, $id, $notifications) {
    if (!$id.loginStatus) {
      return $id.goId();
    }

    $scope.settingsPage = 'notifications';
    $scope.subscription = {};
    $scope.state = {};
    $scope.state.notificationsChanged = false;
    $scope.state.waitingForResponse = false;
    $scope.state.alert = '';

    $scope.notificationTypes = [
      {name: 'sent', title: 'Sent money', correspondingTypes: ['sent'], checked: {email: false, push: false}},
      {name: 'received', title: 'Received money', correspondingTypes: ['received'], checked: {email: false, push: false}},
      {name: 'exchange', title: 'Simple trade executed', correspondingTypes: ['exchange'], checked: {email: false, push: false}},
      {name: 'offernew', title: 'Offer created', correspondingTypes: ['offernew'], checked: {email: false, push: false}},
      {name: 'offer_funded', title: 'Trade executed', correspondingTypes: ['offer_funded', 'offer_partially_funded'], checked: {email: false, push: false}},
      {name: 'trusting', title: 'Gateway added', correspondingTypes: ['trusting'], checked: {email: false, push: false}}
    ];

    $scope.$watch( 'userBlob.data.email',
      function inputLoaded() {
        // Sometimes due to watcher initialization listener is called when the watch expression isn't changed,
        // so it should be checked. See $watch documentation
        if (null == $scope.address || null == $scope.userBlob.data.email || null == $scope.userCredentials.username) {
          return;
        }

        $notifications.getSubscription($scope.address, $scope.userBlob.data.email).success(function(data) {

          $scope.subscription = data;

          if (data.notification_types.email || data.notification_types.push) {
            _.invoke($scope.notificationTypes, function() {
              var intersection;

              intersection = _.intersection(this.correspondingTypes, data.notification_types.email);
              this.checked.email = false;
              if (intersection.length > 0) {
                this.checked.email = true;
              }

              intersection = _.intersection(this.correspondingTypes, data.notification_types.push);
              this.checked.push = false;
              if (intersection.length > 0) {
                this.checked.push = true;
              }
            });
          }
        });
      }
    );

    $scope.persistNotifications = function() {
      $scope.state.waitingForResponse = true;
      $scope.state.alert = '';

      $scope.subscription.name = $scope.userCredentials.username;
      $scope.subscription.email = $scope.userBlob.data.email;
      $scope.subscription.account = $scope.address;
      $scope.subscription.notification_types = {email: [], push: []};

      _.each($scope.notificationTypes, function(nType) {
        if (nType.checked.email) {
          _.each(nType.correspondingTypes, function(cType) {
            $scope.subscription.notification_types.email.push(cType);
          });
        }

        if (nType.checked.push) {
          _.each(nType.correspondingTypes, function(cType) {
            $scope.subscription.notification_types.push.push(cType);
          });
        }
      });

      $notifications.createUpdateSubscription($scope.subscription)
        .success(function(data) {
          $scope.state.waitingForResponse = false;
          $scope.state.alert = 'saved_successfully';
          $scope.state.notificationsChanged = false;
        })
        .error(function(data) {
          $scope.state.waitingForResponse = false;
          $scope.state.alert = 'saved_with_errors';
        });

      // Promt to send roost push notifications
      $window._roost.push(['alias', $scope.userBlob.data.email]);
      $window._roost.prompt();
    };

    $scope.allChecked = function(notificationCategory) {
      var checkCount = 0;

      if ('push' !== notificationCategory) {
        notificationCategory = 'email';
      }

      _.each($scope.notificationTypes, function(nType) {
        if (nType.checked[notificationCategory]) {
          checkCount++;
        }
      });

      return checkCount === $scope.notificationTypes.length;
    };

    $scope.allClicked = function(notificationCategory) {
      if ('push' !== notificationCategory) {
        notificationCategory = 'email';
      }

      var newValue = !$scope.allChecked(notificationCategory);

      _.each($scope.notificationTypes, function(nType) {
        if (nType.checked[notificationCategory] !== newValue) {
          $scope.state.notificationsChanged = true;
        }

        nType.checked[notificationCategory] = newValue;
      });
    };
  }]);
};

module.exports = NotificationsTab;
