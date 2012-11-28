var util = require('util');
var Tab = require('../client/tabmanager').Tab;
var Amount = ripple.Amount;

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

SendTab.prototype.angular = function (module)
{
  var app = this.app;
  module.controller('SendCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
    $scope.reset = function () {
      $scope.mode = "form";
      $scope.recipient = '';
      $scope.amount = '';
      $scope.currency = 'XRP';
      if ($scope.sendform) $scope.sendform.$setPristine(true);
    };
    $scope.send = function () {
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+$scope.currency);

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
      var amount = ripple.Amount.from_human(""+$scope.amount);

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
