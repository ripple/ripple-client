var util = require('util'),
    webutil = require('../client/webutil'),
    Tab = require('../client/tabmanager').Tab,
    Amount = ripple.Amount;

var SendTab = function ()
{
  Tab.call(this);

  this.on('retrigger', this.handleRetrigger.bind(this));
};

util.inherits(SendTab, Tab);

SendTab.prototype.parent = 'main';

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angular = function (module)
{
  var self = this,
      app = this.app,
      tm = this.tm;

  module.controller('SendCtrl', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.$watch('recipient', function(){
      if ($scope.contact = webutil.getContact($scope.userBlob.data.contacts,$scope.recipient)) {
        $scope.recipient_name = $scope.contact.name;
        $scope.recipient_address = $scope.contact.address;
      } else {
        $scope.recipient_name = '';
        $scope.recipient_address = $scope.recipient;
      }
    }, true);

    $scope.$watch('amount', function () {
      $scope.update_amount();
    }, true);

    $scope.$watch('currency', function () {
      $scope.update_amount();
    }, true);

    $scope.update_amount = function () {
      var currency = $scope.currency ?
            $scope.currency.slice(0, 3).toUpperCase() : "XRP";
      var issuer = webutil.findIssuer($scope.lines, currency);
      var formatted = "" + $scope.amount + " " + currency.slice(0, 3);

      // XXX: Needs to show an error
      if (!issuer && currency !== "XRP") return;
      $scope.amount_feedback = ripple.Amount.from_human(formatted);

      if (issuer) $scope.order.sell_amount.set_issuer(issuer);
    };

    /**
     * Used for rpDestination validator
     *
     * @param destionation
     */
    $scope.recipient_query = function (match) {
      return $scope.userBlob.data.contacts.map(function (contact) {
        return contact.name;
      }).filter(function (v) {
        return v.toLowerCase().match(match.toLowerCase());
      });
    };

    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);

    $scope.reset = function () {
      $scope.mode = "form";
      $scope.recipient = '';
      $scope.recipient_name = '';
      $scope.recipient_address = '';
      $scope.amount = '';
      $scope.currency = 'XRP';
      $scope.nickname = '';
      if ($scope.sendForm) $scope.sendForm.$setPristine(true);
    };

    $scope.reset_goto = function (tabName) {
      $scope.reset();

      // TODO do something clever instead of document.location
      // because goToTab does $scope.$digest() which we don't need
      document.location = '#' + tabName;
    };

    /**
     * N2. Confirmation page
     */
    $scope.send = function () {
      var amount = $scope.amount_feedback;

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
      amount.set_issuer($scope.recipient_address);

      var tx = app.net.remote.transaction();
      tx.payment(app.id.account, $scope.recipient_address, amount.to_json());
      if (currency !== 'XRP') {
        tx.build_path(true);
      }
      tx.on('success', function (res) {
        setEngineStatus(res, false);
        $scope.sent(this.hash);
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
    $scope.sent = function (hash) {
      $scope.mode = "sent";
      app.net.remote.on('net_account', handleAccountEvent);

      function handleAccountEvent(e) {
        if (e.transaction.hash === hash) {
          setEngineStatus(e, true);
          $scope.$digest();
          app.net.remote.removeListener('net_account', handleAccountEvent);
        }
      }
    };

    function setEngineStatus(res, accepted) {
      $scope.engine_result = res.engine_result;
      $scope.engine_result_message = res.engine_result_message;
      switch (res.engine_result.slice(0, 3)) {
        case 'tes':
          $scope.tx_result = accepted ? "cleared" : "pending";
          break;
        case 'tem':
          $scope.tx_result = "malformed";
          break;
        case 'ter':
          $scope.tx_result = "failed";
          break;
        case 'tep':
          $scope.tx_result = "partial";
          break;
        default:
          console.warn("Unhandled engine status encountered!");
      }
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
        'address': $scope.recipient_address
      }

      app.id.once('blobsave', function(){
        $scope.contact = contact;
        $scope.addressSaved = true;
      })

      app.$scope.userBlob.data.contacts.unshift(contact);
    }

    $scope.reset();

    self.on('prefill', function (data) {
      $scope.reset();
      $.extend($scope, data);
    });
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
          if (!webutil.getContact($scope.userBlob.data.contacts,value)) {
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

SendTab.prototype.handleRetrigger = function () {
  var $scope = $('#t-send').data('$scope');
  if ($scope && $scope.mode !== 'form') {
    $scope.reset();
    $scope.$digest();
  }
};

module.exports = SendTab;
