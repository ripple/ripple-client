var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount;

var SendTab = function ()
{
  Tab.call(this);
};

util.inherits(SendTab, Tab);

SendTab.prototype.mainMenu = 'send';

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angular = function (module)
{
  module.controller('SendCtrl', ['$scope', '$timeout', '$routeParams', 'rpId', 'rpNetwork',
                                 function ($scope, $timeout, $routeParams, $id, $network)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.xrp = _.where($scope.currencies_all, {value: "XRP"})[0];
    $scope.account_memory = {};

    $scope.$watch('send.recipient', function(){
      var addr = webutil.stripRippleAddress($scope.send.recipient);

      $scope.contact = webutil.getContact($scope.userBlob.data.contacts,addr);
      if ($scope.contact) {
        if ($scope.send.recipient === $scope.contact.address) {
          $scope.send.recipient = $scope.contact.name;
        }
        $scope.send.recipient_name = $scope.contact.name;
        $scope.send.recipient_address = $scope.contact.address;

        if ($scope.contact.dt) {
          $scope.send.dt = $scope.contact.dt;
        }
      } else {
        $scope.send.recipient_name = '';
        $scope.send.recipient_address = addr;
      }

      $scope.update_send();
      $scope.update_trust_limit();
    }, true);

    $scope.$watch('send.amount', function () {
      $scope.update_send();
    }, true);

    $scope.$watch('send.currency', function () {
      $scope.send.currency_code = $scope.send.currency ? $scope.send.currency.slice(0, 3).toUpperCase() : "XRP";
      $scope.update_send();
      $scope.update_trust_limit();
    }, true);

    var pathUpdateTimeout;
    $scope.update_send = function () {
      var currency = $scope.send.currency_code;
      var recipient = $scope.send.recipient_address;
      var formatted = "" + $scope.send.amount + " " + currency.slice(0, 3);

      // Trying to send XRP to self
      $scope.send.self = recipient == $scope.address && $scope.send.amount;

      // if formatted or money to send is 0 then don't calculate paths or offer to send
      if (parseFloat(formatted) === 0)
      {
        $scope.error_type = 'required';
        return false;
      }

      if (recipient || currency === "XRP") {
        $scope.send.amount_feedback = Amount.from_human(formatted);

        if (recipient) $scope.send.amount_feedback.set_issuer(recipient);
      } else {
        $scope.send.amount_feedback = new Amount(); // = NaN
      }

      var modified = $scope.send.recipient_prev !== recipient ||
        !$scope.send.amount_prev.is_valid() ||
        !$scope.send.amount_feedback.is_valid() ||
        !$scope.send.amount_feedback.equals($scope.send.amount_prev);

      if (!modified) return;

      $scope.send.recipient_prev = recipient;
      $scope.send.amount_prev = $scope.send.amount_feedback;

      if (recipient && $scope.send.amount_feedback.is_valid()) {
        $scope.send.path_status = 'pending';

        $scope.send.path_sets = null;
        $scope.send.alt = null;

        if ($scope.send.amount_feedback.is_native()) {
          $scope.send.type = 'native';
          $scope.check_destination();
        } else {
          $scope.send.type = 'nonnative';
        }

        if (pathUpdateTimeout) clearTimeout(pathUpdateTimeout);
        pathUpdateTimeout = setTimeout($scope.update_paths, 500);
      } else {
        $scope.send.path_status = 'waiting';
      }
    };

    // Trust limit. Show notice about the trust in currency user's trying to send.
    $scope.update_trust_limit = function () {
      $scope.send.trust_limit = 0;
      if ($scope.send.recipient_address && $scope.send.currency_code) {
        _.each($scope.lines, function (line) {
          if (line.account === $scope.send.recipient_address && line.currency == $scope.send.currency_code) {
            $scope.send.trust_limit = line.limit_peer;
          }
        });
      }
    };

    // Check destionation for XRP sufficiency and flags
    $scope.check_destination = function () {
      $scope.send.fund_status = "none";

      var recipient = $scope.send.recipient_address;
      // do some remote request to find out account info, if it's not stored in memory already.
      if ($scope.account_memory.hasOwnProperty(recipient)) {
        setError();
      } else {
        $network.remote.request_account_info($scope.send.recipient_address)
          .on('error', function (e) {
            $scope.$apply(function () {
              if (e.remote.error == "actNotFound") {
                $scope.account_memory[recipient] = {};
              }
              setError();
            });
          })
          .on('success', function (data) {
            $scope.$apply(function () {
              $scope.account_memory[recipient] = {
                'balance': data.account_data.Balance,
                'disallowXrp': data.account_data.Flags & ripple.Remote.flags.account_root.DisallowXRP
              };
              setError();
            });
          })
          .request();
      }

      function setError() {
        var total = $scope.send.amount_feedback.add($scope.account_memory[recipient].balance);
        var reserve_base = $scope.account.reserve_base;
        if (total.compareTo(reserve_base) < 0) {
          $scope.send.fund_status = "insufficient-xrp";
          $scope.xrp_deficiency = reserve_base.subtract($scope.account_memory[recipient].balance);
        }

        $scope.disallowXrp = $scope.account_memory[recipient] ? $scope.account_memory[recipient].disallowXrp : false;
      }
    };

    $scope.update_paths = function () {
      var recipient = $scope.send.recipient_address;
      $network.remote.request_ripple_path_find($id.account,
                                              $scope.send.recipient_address,
                                              $scope.send.amount_feedback)
        .on('error', function (e) {
          $scope.$apply(function () {
            $scope.path_status = "error";
          });
        })
        .on('success', function (data) {
          $scope.$apply(function () {
            if (!data.alternatives || !data.alternatives.length) {
              $scope.send.path_status = "no-path";
            } else {
              $scope.send.path_status = "done";
              $scope.send.alternatives = _.map(data.alternatives, function (raw) {
                var alt = {};
                alt.amount = Amount.from_json(raw.source_amount);
                alt.send_max = alt.amount.product_human(Amount.from_json('1.01'));
                alt.paths = raw.paths_computed
                  ? raw.paths_computed
                  : raw.paths_canonical;

                return alt;
              });
//              $scope.send.alt = $scope.send.alternatives[0];
            }
          });
        })
        .request();
    };

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.recipient_query = webutil.queryFromOptions(contacts);
    }, true);
    $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);
    $scope.$watch('lines', function (lines) {
      var currencies = _.uniq(_.map(_.keys(lines), function (line) {
        return line.slice(-3);
      }));

      // XXX Not the fastest way of doing it...
      currencies = _.map(currencies, function (currency) {
        _.each($scope.currencies_all, function (entry) {
          if (currency === entry.value) {
            currency = entry.name;
            return false;
          }
        });
        return currency;
      });
      $scope.source_currency_query = webutil.queryFromArray(currencies);
    }, true);

    $scope.reset = function () {
      $scope.mode = "form";

      // XXX Most of these variables should be properties of $scope.send.
      //     The Angular devs recommend that models be objects due to the way
      //     scope inheritance works.
      $scope.send = {
        recipient: '',
        recipient_name: '',
        recipient_address: '',
        recipient_prev: '',
        amount: '',
        amount_prev: new Amount(),
        currency: $scope.xrp.name,
        currency_code: "XRP",
        path_status: 'waiting',
        fund_status: 'none'
      };
      $scope.nickname = '';
      $scope.error_type = '';
      $scope.resetAddressForm();
      if ($scope.sendForm) $scope.sendForm.$setPristine(true);
    };

    $scope.cancelConfirm = function () {
      $scope.mode = "form";
      $scope.send.alt = null;
    };

    $scope.resetAddressForm = function() {
      $scope.show_save_address_form = false;
      $scope.addressSaved = false;
      $scope.saveAddressName = '';
      $scope.addressSaving = false;
      if ($scope.saveAddressForm) $scope.saveAddressForm.$setPristine(true);
    };

    $scope.reset_goto = function (tabName) {
      $scope.reset();

      // TODO do something clever instead of document.location
      // because goToTab does $scope.$digest() which we don't need
      document.location = '#' + tabName;
    };

    /**
     * N2. Waiting for path page
     */
    $scope.calculate_send = function () {
      var amount = $scope.send.amount_feedback;
      $scope.sendmax_feedback = null;
      $scope.prepared_paths = null;

      $scope.mode = "wait_path";

      $network.remote.request_account_info($scope.send.recipient_address)
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
          if (amount.is_native() && !$scope.send.source_currency) {
            $scope.$apply($scope.send_prepared);
          } else {
            $network.remote.request_ripple_path_find($id.account,
                                                    $scope.send.recipient_address,
                                                    amount)
            // XXX Handle error response
              .on('success', function (data) {
                $scope.$apply(function () {
                  if (!data.alternatives || !data.alternatives.length) {
                    $scope.mode = "error";
                    $scope.error_type = "noPath";
                  } else {
                    var base_amount = Amount.from_json(data.alternatives[0].source_amount);
                    $scope.sendmax_feedback =
                      base_amount.product_human(Amount.from_json('1.01'));
                    $scope.prepared_paths = data.alternatives[0].paths_computed
                      ? data.alternatives[0].paths_computed
                      : data.alternatives[0].paths_canonical;
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
      // check if paths are available, if not then it is a direct send
      $scope.send.indirect = $scope.send.alt ? $scope.send.alt.paths.length : false;

      $scope.confirm_wait = true;
      $timeout(function () {
        $scope.confirm_wait = false;
      }, 1000, true);

      $scope.mode = "confirm";
    };

    /**
     * N4. Waiting for transaction result page
     */
    $scope.send_confirmed = function () {
      var currency = $scope.send.currency.slice(0, 3).toUpperCase();
      var amount = Amount.from_human(""+$scope.send.amount+" "+currency);
      var addr = $scope.send.recipient_address;
      var dt = $scope.send.dt ? $scope.send.dt : webutil.getDestTagFromAddress($scope.send.recipient);

      amount.set_issuer(addr);

      var tx = $network.remote.transaction();

      // Destination tag
      tx.destination_tag(dt);

      // Source tag
      if ($scope.send.st) {
        tx.source_tag($scope.send.st);
      }

      tx.payment($id.account, addr, amount.to_json());
      if ($scope.send.alt) {
        tx.send_max($scope.send.alt.send_max);
        tx.paths($scope.send.alt.paths);
      } else {
        if (!amount.is_native()) {
          tx.build_path(true);
        }
      }
      tx.on('success', function (res) {
        $scope.$apply(function () {
          setEngineStatus(res, false);
          $scope.sent(tx.hash);

          // Remember currency and increase order
          var found;

          for (var i = 0; i < $scope.currencies_all.length; i++) {
            if ($scope.currencies_all[i].value.toLowerCase() == $scope.send.amount_feedback.currency().to_human().toLowerCase()) {
              $scope.currencies_all[i].order++;
              found = true;
              break;
            }
          }

          if (!found) {
            $scope.currencies_all.push({
              "name": $scope.send.amount_feedback.currency().to_human().toUpperCase(),
              "value": $scope.send.amount_feedback.currency().to_human().toUpperCase(),
              "order": 1
            });
          }
        });
      });
      tx.on('error', function (res) {
        setImmediate(function () {
          $scope.$apply(function () {
            $scope.mode = "error";

            if (res.error === 'remoteError' &&
                res.remote.error === 'noPath') {
              $scope.mode = "status";
              $scope.tx_result = "noPath";
            }
          });
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
      $network.remote.on('transaction', handleAccountEvent);

      function handleAccountEvent(e) {
        $scope.$apply(function () {
          if (e.transaction.hash === hash) {
            setEngineStatus(e, true);
            $network.remote.removeListener('transaction', handleAccountEvent);
          }
        });
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
        case 'tef':
          $scope.tx_result = "failure";
          break;
        default:
          console.warn("Unhandled engine status encountered!");
      }
    }

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        'name': $scope.saveAddressName,
        'address': $scope.send.recipient_address
      };

      var removeListener = $scope.$on('$blobSave', function () {
        removeListener();
        $scope.contact = contact;
        $scope.addressSaved = true;
      });

      $scope.userBlob.data.contacts.unshift(contact);
    };

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
              if (scope.send.currency == xrpWidget.$viewValue) {
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

module.exports = SendTab;
