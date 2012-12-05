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

SendTab.prototype.angularDeps = ['fields'];

SendTab.prototype.angular = function (module)
{
  var app = this.app;
  var tm = this.tm;

  module.controller('SendCtrl', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.getContact = function (name) {}

    if (app.id.data) {
      $scope.getContact = function (name) {
        return app.id.getContact(name);
      }
      $scope.recipient_query = function (match) {
        return app.id.getContactNames().filter(function (v) {
          return v.toLowerCase().match(match.toLowerCase());
        });
      };
    }

    // TODO code duplication
    app.id.on('blobupdate', function (e) {
      $scope.getContact = function (name) {
        return app.id.getContact(name);
      }
      $scope.recipient_query = function (match) {
        return app.id.getContactNames().filter(function (v) {
          return v.toLowerCase().match(match.toLowerCase());
        });
      };
      $scope.$digest();
    })

    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);

    $scope.reset = function () {
      $scope.mode = "form";
      $scope.recipient = '';
      $scope.amount = '';
      $scope.currency = 'XRP';
      $scope.nickname = '';
      if ($scope.sendform) $scope.sendform.$setPristine(true);
    };

    /**
     * N2. Confirmation page
     */
    $scope.send = function () {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+currency);

      $scope.amount_feedback = amount.to_human();
      $scope.currency_feedback = amount._currency.to_json();

      $scope.recipient_name = $scope.recipient;

      if ($scope.contact = app.id.getContact($scope.recipient)) {
        $scope.recipient_name = $scope.contact.name;
        $scope.recipient_extra = $scope.contact.address;

        $scope.recipient = $scope.contact.address;
      }

      $scope.confirm_wait = true;
      $timeout(function () {
        $scope.confirm_wait = false;
        $scope.$digest();
      }, 1000);

      $scope.mode = "confirm";
    };

    /**
     * N3. Waiting for transaction result page
     */
    $scope.send_confirmed = function () {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+currency);
      amount.set_issuer($scope.recipient);

      var tx = app.net.remote.transaction();
      tx.payment(app.id.account, $scope.recipient, amount.to_json());
      tx.build_path(true);
      tx.set_flags('CreateAccount');
      tx.on('success', function () {
        $scope.sent();
        $scope.$digest();
      });
      tx.on('error', function () {
        $scope.mode = "error";
        $scope.$digest();
      });
      tx.submit();

      $scope.mode = "sending";
    };

    /**
     * N5. Sent page
     */
    $scope.sent = function () {
      $scope.mode = "sent";
    }

    $scope.showSaveAddressForm = function () {
      $('#saveAddressForm').slideDown();
    }

    $scope.hideSaveAddressForm = function () {
      $('#saveAddressForm').slideUp();
    }

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        'name': $scope.saveAddressName,
        'address': $scope.recipient
      }

      app.id.addContact(contact, function(){
        $scope.contact = contact;
        $scope.addressSaved = true;

        $scope.$digest();
      })
    }

    $scope.reset();
  }]);

  /**
   * Contact name and address uniqueness validator
   */
    // TODO move to global directives
  module.directive('unique', function() {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function ($scope, elm, attr, ctrl) {
        if (!ctrl) return;

        var validator = function(value) {
          if (!app.id.getContact(value)) {
            ctrl.$setValidity('unique', true);
            return value;
          } else {
            ctrl.$setValidity('unique', false);
            return;
          }
        };

        ctrl.$formatters.push(validator);
        ctrl.$parsers.unshift(validator);

        attr.$observe('unique', function() {
          validator(ctrl.$viewValue);
        });
      }
    };
  });
};

module.exports = SendTab;
