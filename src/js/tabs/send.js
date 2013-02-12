var util = require('util'),
    webutil = require('../util/web'),
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

  module.controller('SendCtrl', ['$scope', '$timeout', function ($scope, $timeout)
  {
    $scope.xrp = $scope.currencies_all[0];

    $scope.$watch('recipient', function(){
      var addr=webutil.stripRippleAddress($scope.recipient);

      if ($scope.contact = webutil.getContact($scope.userBlob.data.contacts,addr)) {
        $scope.recipient_name = $scope.contact.name;
        $scope.recipient_address = $scope.contact.address;
      } else {
        $scope.recipient_name = '';
        $scope.recipient_address = addr;
      }

      $scope.update_amount();
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
      var issuer = $scope.recipient_address;
      var formatted = "" + $scope.amount + " " + currency.slice(0, 3);

      if (!issuer && currency !== "XRP") return;
      $scope.amount_feedback = ripple.Amount.from_human(formatted);

      if (issuer) $scope.amount_feedback.set_issuer(issuer);
    };

    /**
     * Used for rpDestination validator
     *
     * @param destionation
     */
    $scope.recipient_query = function (match, re) {
      var opts = $scope.userBlob.data.contacts.map(function (contact) {
        return contact.name;
      });

      if (re instanceof RegExp) {
        return opts.filter(function (name) {
          return "string" === typeof name
            ? name.match(re)
            : false;
        });
      } else return opts;
    };

    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);

    $scope.reset = function () {
      $scope.mode = "form";
      $scope.recipient = '';
      $scope.recipient_name = '';
      $scope.recipient_address = '';
      $scope.amount = '';
      $scope.currency = $scope.xrp.name;
      $scope.nickname = '';
      $scope.error_type = '';
      $scope.resetAddressForm();
      if ($scope.sendForm) $scope.sendForm.$setPristine(true);

      // No funds
      if (app.$scope.balance == '0') {
        $scope.mode = 'localError';
        $scope.error_type = 'noFunds';
      }

      // Focus on first input
      setImmediate(function() {
        $('#sendForm').find('input:first').focus();
      });
    };

    // Show send form if account has been funded while the user is seeing error page
    $scope.$watch('balance', function(){
      if ('localError' == $scope.mode && '0' !== app.$scope.balance) {
        $scope.mode = 'form';
        $scope.errorMessage = '';
      }
    }, true);

    $scope.resetAddressForm = function() {
      $scope.show_save_address_form = false;
      $scope.addressSaved = false;
      $scope.saveAddressName = '';
      $scope.addressSaving = false;
      if ($scope.saveAddressForm) $scope.saveAddressForm.$setPristine(true);
    };

    self.on('reset', $scope.reset);

    $scope.reset_goto = function (tabName) {
      $scope.reset();

      // TODO do something clever instead of document.location
      // because goToTab does $scope.$digest() which we don't need
      document.location = '#' + tabName;
    };

    /**
     * N2. Waiting for path page
     */
    $scope.send = function () {
      var amount = $scope.amount_feedback;
      $scope.sendmax_feedback = null;

      $scope.mode = "wait_path";

      app.net.remote.request_account_info($scope.recipient_address)
        .on('error', function (data) {
          $scope.$apply(function () {
            $scope.mode = "error";
            if (data.error === "remoteError" &&
                data.remote.error === "actNotFound") {
              if (amount.is_native()) {
                // XXX Show info about creating accounts, reserve reqs etc.
                $scope.send_prepared();
              } else {
                $scope.error_type = "noDest";
              }
            }
          });
        })
        .on('success', function (data) {
          if (amount.is_native()) {
            $scope.$apply($scope.send_prepared);
          } else {
            app.net.remote.request_ripple_path_find(app.id.account,
                                                    $scope.recipient_address,
                                                    amount)
            // XXX Handle error response
              .on('success', function (data) {
                $scope.$apply(function () {
                  if (!data.alternatives || !data.alternatives.length) {
                    $scope.mode = "error";
                    $scope.error_type = "noPath";
                  } else {
                    var base_amount = ripple.Amount.from_json(data.alternatives[0].source_amount);
                    $scope.sendmax_feedback =
                      base_amount.product_human(ripple.Amount.from_json('1.01'));
                    $scope.send_prepared();
                  }
                });
              })
              .request();

          }
        })
        .request();
    };

    /**
     * N3. Confirmation page
     */
    $scope.send_prepared = function () {
      $scope.confirm_wait = true;
      $timeout(function () {
        $scope.confirm_wait = false;
        $scope.$digest();
      }, 1000);

      $scope.mode = "confirm";
    };

    /**
     * N4. Waiting for transaction result page
     */
    $scope.send_confirmed = function () {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+currency);
      var addr = $scope.recipient_address;
      var dt = $scope.urlParams.dt ? $scope.urlParams.dt : webutil.getDestTagFromAddress($scope.recipient);

      amount.set_issuer(addr);

      var tx = app.net.remote.transaction();

      // Destination tag
      tx.destination_tag(dt);

      // Source tag
      if ($scope.urlParams.st) {
        tx.source_tag($scope.urlParams.st);
      }

      tx.payment(app.id.account, addr, amount.to_json());
      if (!amount.is_native()) {
        tx.send_max($scope.sendmax_feedback);
        tx.build_path(true);
      }
      tx.on('success', function (res) {
        setEngineStatus(res, false);
        $scope.sent(this.hash);
        $scope.$digest();
      });
      tx.on('error', function (res) {
        setImmediate(function () {
          $scope.mode = "error";

          if (res.error === 'remoteError' &&
              res.remote.error === 'noPath') {
            $scope.mode = "status";
            $scope.tx_result = "noPath";
          }
          $scope.$digest();
        });
      });
      tx.submit();

      $scope.mode = "sending";
    };

    /**
     * N6. Sent page
     */
    $scope.sent = function (hash) {
      $scope.mode = "status";
      app.net.remote.on('account', handleAccountEvent);

      function handleAccountEvent(e) {
        if (e.transaction.hash === hash) {
          setEngineStatus(e, true);
          $scope.$digest();
          app.net.remote.removeListener('account', handleAccountEvent);
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
        case 'tec':
          $scope.tx_result = "claim";
          break;
        default:
          console.warn("Unhandled engine status encountered!");
      }
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

    // If all the form fields are prefilled, go to confirmation page
    if ($scope.urlParams.to && $scope.urlParams.amount) {
      setImmediate(function() {
        $scope.send();
      });
    }

    // TODO I think we should handle urlParams autofill and prefill event in similar way
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

  /**
   * Don't allow the user to send XRP to himself
   */
  module.directive('rpXrpToMe', function () {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, elm, attr, ctrl) {
        console.log(elm.inheritedData('$formController'));
        var xrpWidget = elm.inheritedData('$formController')[attr.rpXrpToMe];

        ctrl.$parsers.unshift(function(value) {
          var contact = webutil.getContact(scope.userBlob.data.contacts,value);

          if (value) {
            if ((contact && contact.address == scope.userBlob.data.account_id) || scope.userBlob.data.account_id == value) {
              if (scope.currency == xrpWidget.$viewValue) {
                ctrl.$setValidity('rpXrpToMe', false);
                return;
              }
            }
          }

          ctrl.$setValidity('rpXrpToMe', true);
          return value;
        });

        xrpWidget.$parsers.unshift(function(value) {
          ctrl.$setValidity('rpXrpToMe', value === ctrl.$viewValue);
          return value;
        });
      }
    };
  });
}

SendTab.prototype.handleRetrigger = function () {
  var $scope = $('#t-send').data('$scope');
  if ($scope && $scope.mode !== 'form') {
    $scope.reset();
    $scope.$digest();
  }
};

module.exports = SendTab;
