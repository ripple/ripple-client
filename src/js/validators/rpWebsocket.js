/**
 * Websocket validator
 */

var module = angular.module('validators');

module.directive('rpWebsocket', function($timeout, $parse) {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, elm, attr, ctrl) {
      if (!ctrl) return;

      function showLoading(doShow) {
        if (attr.rpServerLoading) {
          var getterL = $parse(attr.rpServerLoading);
          getterL.assign(scope, doShow);
        }
      }

      var validator = function(value) {
        if (!value) return;

        var connection;

        showLoading(true);

        try {
          connection = new WebSocket(
            // something like 'wss://host:port'
            (attr.rpWebsocketSecure === 'true' ? 'wss' : 'ws') + '://'
            + value
            + (attr.rpWebsocketPort ? ':' + attr.rpWebsocketPort : '')
          );
        } catch (err) {}

        if (!connection) {
          showLoading(false);
          return;
        }

        connection.onopen = function() {
          connection.send('{"command": "ping"}');
        };

        connection.onerror = function(e) {
          scope.$apply(function() {
            ctrl.$setValidity('rpWebsocket', false);
            showLoading(false);
          });
        };

        connection.onmessage = function(e) {
          var test = JSON.parse(e.data).status === 'success';
          scope.$apply(function() {
            ctrl.$setValidity('rpWebsocket', test);
            showLoading(false);
          });
        };

        return value;
      };

      ctrl.$formatters.push(validator);
      ctrl.$parsers.unshift(validator);

      attr.$observe('rpWebsocket', function() {
        validator(ctrl.$viewValue);
      });

      attr.$observe('rpWebsocketPort', function() {
        validator(ctrl.$viewValue);
      });

      attr.$observe('rpWebsocketSecure', function() {
        validator(ctrl.$viewValue);
      });
    }
  };
});