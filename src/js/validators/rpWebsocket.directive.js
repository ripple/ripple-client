/**
 * Websocket validator
 */

var module = angular.module('validators');

module.directive('rpWebsocket', function($q, $timeout, $parse) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      ctrl.$asyncValidators.rpWebsocket = function(value) {

        var defer = $q.defer(),
            connection;

        if (!value) return $q.reject(false);

        $timeout(function() {
          try {
            connection = new WebSocket(
                // something like 'wss://host:port'
                (attr.rpWebsocketSecure === 'true' ? 'wss' : 'ws') + '://'
                + value
                + (attr.rpWebsocketPort ? ':' + attr.rpWebsocketPort : '')
                );
          } catch (err) {}

          if (!connection) return $q.reject(false);

          connection.onopen = function() {
            connection.send('{"command": "ping"}');
          };

          connection.onerror = function(e) {
            defer.reject();
          };

          connection.onmessage = function(e) {
            if (JSON.parse(e.data).status === 'success') {
              defer.resolve();
            } else {
              defer.reject();
            }
          };
        }, 500);
        return defer.promise;
      };

      attr.$observe('rpWebsocket', function(val) {
        ctrl.$validate();
      });

      attr.$observe('rpWebsocketPort', function(val) {
        ctrl.$validate();
      });

      attr.$observe('rpWebsocketSecure', function(val) {
        ctrl.$validate();
      });
    }
  };
});
