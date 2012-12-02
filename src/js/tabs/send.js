var util = require('util'),
    webutil = require('../client/webutil'),
    Tab = require('../client/tabmanager').Tab,
    Amount = ripple.Amount;

var SendTab = function ()
{
  Tab.call(this);
};

util.inherits(SendTab, Tab);

SendTab.prototype.parent = 'main';

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angularDeps = ['directives'];

SendTab.prototype.angular = function (module)
{
  var app = this.app;
  module.controller('SendCtrl', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.recipient_query = function (match) {
      return ['Alice','Antony','Bob','Charlie','Chandra'].filter(function (v) {
        return v.toLowerCase().match(match.toLowerCase());
      });
    };

    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);

    $scope.reset = function () {
      $scope.mode = "form";
      $scope.recipient = '';
      $scope.amount = '';
      $scope.currency = 'XRP';
      $scope.nickname = '';
      if ($scope.sendform) $scope.sendform.$setPristine(true);
    };

    $scope.send = function () {
      if ($scope.sendform.$invalid) {
        // TODO: If form is not valid, force all errors to appear, then return.
        return;
      }

      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+currency);

      $scope.amount_feedback = amount.to_human();
      $scope.currency_feedback = amount._currency.to_json();
      $scope.recipient_extra = "(not in address book)";

      $scope.confirm_wait = true;
      $timeout(function () {
        $scope.confirm_wait = false;
        $scope.$digest();
      }, 1000);

      $scope.mode = "confirm";
    };

    $scope.send_confirmed = function () {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+currency);

      var tx = app.net.remote.transaction();
      tx.payment(app.id.account, $scope.recipient, amount.to_json());
      tx.set_flags('CreateAccount');
      tx.on('success', function () {
        $scope.reset();
        $scope.$digest();
      });
      tx.on('error', function () {
        $scope.mode = "error";
        $scope.$digest();
      });
      tx.submit();

      $scope.mode = "sending";
    };

    $scope.reset();
  }]);
};

module.exports = SendTab;
