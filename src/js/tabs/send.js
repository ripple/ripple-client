var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base;

var SendTab = function ()
{
  Tab.call(this);
};

util.inherits(SendTab, Tab);

SendTab.prototype.mainMenu = 'send';

SendTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['federation']);

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angular = function (module)
{
  module.controller('SendCtrl', ['$scope', '$timeout', '$routeParams', 'rpId',
                                 'rpNetwork', 'rpFederation',
                                 function ($scope, $timeout, $routeParams, $id,
                                           $network, $federation)
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

      $scope.update_destination();
    }, true);

    $scope.$watch('send.currency', function () {
      $scope.send.currency_code = $scope.send.currency ? $scope.send.currency.slice(0, 3).toUpperCase() : "XRP";
      $scope.update_currency();
    }, true);

    $scope.$watch('send.amount', function () {
      $scope.update_amount();
    }, true);

    var destUpdateTimeout;

    // Reset everything that depends on the destination
    $scope.reset_destination_deps = function() {
      var send = $scope.send;
      send.self = false;
      send.bitcoin = false;
      send.email = false;
      send.fund_status = "none";

      // Reset federation address validity status
      $scope.sendForm.send_destination.$setValidity("federation", true);

      // Now starting to work on resolving the recipient
      send.recipient_resolved = false;

      $scope.reset_currency_deps();
    };

    $scope.update_destination = function () {
      var send = $scope.send;
      var recipient = send.recipient_address;

      if (recipient === send.last_recipient) return;
      send.last_recipient = recipient;

      $scope.reset_destination_deps();

      // Trying to send XRP to self
      send.self = recipient === $scope.address && $scope.send.amount;

      // Trying to send to a Bitcoin address
      send.bitcoin = !isNaN(Base.decode_check([0, 5], recipient, 'bitcoin'));

      // Trying to send to an email/federation address
      send.email = ("string" === typeof recipient) && ~recipient.indexOf('@');

      // Do we need to perform a remote lookup?
      var isRemote = send.email;

      if (destUpdateTimeout) $timeout.cancel(destUpdateTimeout);
      destUpdateTimeout = $timeout($scope.update_destination_remote, 500);
    };

    $scope.update_destination_remote = function () {
      var send = $scope.send;
      var recipient = send.recipient_address;

      // Reset federation address validity status
      $scope.sendForm.send_destination.$setValidity("federation", true);

      if (send.bitcoin) {
        // Destination is not known yet, skip ahead
        $scope.update_currency_constraints();
      } else if (send.email) {
        send.path_status = "fed-check";
        $federation.check_email(recipient)
          .then(function (result) {
            // Check if this request is still current, exit if not
            var now_recipient = send.recipient_actual || send.recipient_address;
            if (recipient !== now_recipient) return;

            send.recipient_name = recipient;
            send.recipient_address = result.destination_address;

            $scope.check_destination();
          }, function (error) {
            // Check if this request is still current, exit if not
            var now_recipient = send.recipient_actual || send.recipient_address;
            if (recipient !== now_recipient) return;

            send.path_status = "waiting";
            $scope.sendForm.send_destination.$setValidity("federation", false);
          })
        ;
      } else {
        $scope.check_destination();
      }
    };

    // Check destionation for XRP sufficiency and flags
    $scope.check_destination = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;

      if (!ripple.UInt160.is_valid(recipient)) return;

      var account = $network.remote.account(recipient);

      send.path_status = 'checking';
      account.entry(function (e, data) {
        $scope.$apply(function () {
          // Check if this request is still current, exit if not
          var now_recipient = send.recipient_actual || send.recipient_address;
          if (recipient !== now_recipient) return;

          // If we get this far, we have a Ripple address resolved
          send.recipient_resolved = true;

          if (e) {
            if (e.remote.error == "actNotFound") {
              send.recipient_info = {
                'exists': false,
                'Balance': "0"
              };
              $scope.update_currency_constraints();
            } else {
              // XXX Actual error
            }
          } else {
            $scope.disallowXrp = data.account_data.Flags & ripple.Remote.flags.account_root.DisallowXRP;

            send.recipient_info = {
              'exists': true,
              'Balance': data.account_data.Balance,
              'disallow_xrp': $scope.disallowXrp
            };

            if (!$scope.account || !$scope.account.reserve_base) return;

            var reserve_base = $scope.account.reserve_base;
            send.xrp_deficiency = reserve_base.subtract(data.account_data.Balance);

            send.recipient_lines = false;
            $scope.update_currency_constraints();

            // XXX Request available currency choices from server
            //     We need some server-side support for this. Right now, the
            //     server will just dutifully send us thousands of trust lines
            //     if we request account_lines on a major gateway.
            //
            //     We need either a account_lines RPC call with a max_lines
            //     setting or a dedicated account_accepted_currencies command.
            /*
            account.lines(function (e, data) {
              $scope.$apply(function () {
                // Check if this request is still current, exit if not
                var now_recipient = send.recipient_actual || send.recipient_address;
                if (recipient !== now_recipient) return;

                if (e) {
                  // XXX Actual error
                } else {
                  send.recipient_lines = data.lines;
                  $scope.update_currency_constraints();
                }
              });
            });
            */
          }
        });
      });

      function setError() {
      }
    };


    /**
     * Update any constraints on what currencies the user can select.
     *
     * In many modes, the user is restricted in terms of what they can send. For
     * example, when sending to a Bitcoin address, they can only send BTC.
     *
     * This function checks those conditions and updates the UI.
     */
    $scope.update_currency_constraints = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;

      // Reset constraints
      send.currency_choices = $scope.currencies_all;
      send.currency_force = false;

      if (send.bitcoin) {
        // Force BTC
        send.currency_choices = ["BTC"];
        send.currency_force = "BTC";
        send.currency = "BTC";
        return;
      }

      if (!send.recipient_info) return;

      if (send.recipient_info.exists && send.recipient_lines) {
        // XXX This clause is not in use
        // ---------------------------------------------------------------------
        var lines = send.recipient_lines;

        // Generate list of accepted currencies from their trust lines
        send.currency_choices = _.uniq(_.compact(_.map(lines, function (line) {
          return line.currency;
        })));

        // Add XRP if they allow it
        if (!send.recipient_info.disallow_xrp) {
          send.currency_choices.unshift("XRP");
        }
        // ---------------------------------------------------------------------
      } else if (send.recipient_info.exists) {
        // Their account exists, but we couldn't grab their trust lines,
        // probably because their owner directory is too large. So, we'll
        // just show a default selection of currencies.

        // If we do nothing here, we'll be showing the default currency list

        // Do nothing
      } else {
        // If the account doesn't exist, we can only send XRP
        send.currency_choices = ["XRP"];
        send.currency_force = "XRP";
        send.currency = "XRP";
      }

      $scope.update_currency();
    };


    // Reset anything that depends on the currency 
    $scope.reset_currency_deps = function () {
      
      // XXX Reset



      $scope.reset_amount_deps();
    };

    $scope.update_currency = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;
      var currency = send.currency;

      $scope.reset_currency_deps();

      if (!ripple.UInt160.is_valid(recipient)) {
        return;
      }
      // Recipient + currency
      var recu = recipient.length + "|" + recipient + currency;
      if (send.last_recu === recu) return;
      send.last_recu = recu;

      $scope.update_amount();
    };

    var pathUpdateTimeout;

    $scope.reset_amount_deps = function () {
      var send = $scope.send;
      send.sender_insufficient_xrp = false;

      $scope.reset_paths();
    };

    $scope.update_amount = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;
      var currency = send.currency;
      var formatted = "" + send.amount + " " + currency.slice(0, 3);

      var amount = send.amount_feedback = Amount.from_human(formatted);

      $scope.reset_amount_deps();
      send.path_status = 'waiting';

      // If there is a timeout in progress, we want to cancel it, since the
      // inputs have changed.
      if (pathUpdateTimeout) $timeout.cancel(pathUpdateTimeout);

      // If the form is invalid, we won't be able to submit anyway, so no point
      // in calculating paths.
      if ($scope.sendForm.$invalid) return;

      if (send.bitcoin) {
        if (!send.amount_feedback.is_valid())
          return;

        // Dummy issuer
        send.amount_feedback.set_issuer(1);
        pathUpdateTimeout = $timeout($scope.update_quote, 500);
      } else {
        if (!ripple.UInt160.is_valid(recipient) || !ripple.Amount.is_valid(amount)) {
          // XXX Error?
          return;
        }

        // Create Amount object
        if (!send.amount_feedback.is_native()) {
          send.amount_feedback.set_issuer(recipient);
        }

        // If we don't have recipient info yet, then don't search for paths
        if (!send.recipient_info) {
          return;
        }

        // Cannot make XRP payment if the sender does not have enough XRP
        if (send.amount_feedback.is_native()
            && $scope.account.max_spend
            && $scope.account.max_spend.to_number() > 1
            && $scope.account.max_spend.compareTo(send.amount_feedback) < 0) {

          send.sender_insufficient_xrp = true;          
        } else {
          send.sender_insufficient_xrp = false;
        }

        var total = send.amount_feedback.add(send.recipient_info.Balance);
        var reserve_base = $scope.account.reserve_base;
        if (total.compareTo(reserve_base) < 0) {
          send.fund_status = "insufficient-xrp";
          send.xrp_deficiency = reserve_base.subtract(send.recipient_info.Balance);
        }

        // If the destination doesn't exist, then don't search for paths.
        if (!send.recipient_info.exists) {
          send.path_status = 'none';
          return;
        }

        send.path_status = 'pending';
        pathUpdateTimeout = $timeout($scope.update_paths, 500);
      }
    };

    /**
     * Query the bridge for a quote.
     *
     * This will set send.amount_actual and send.recipient_actual based on the
     * quote that the bridge returns.
     */
    $scope.update_quote = function () {
      var send = $scope.send;

      // Bitcoin outbound bridge path find
      try {
        // Get a quote
        send.path_status = "bridge-quote";
        $.ajax({
          url: Options.bridge.out.bitcoin,
          dataType: 'json',
          data: {
            type: "quote",
            amount: send.amount_feedback.to_text()+"/BTC"
          },
          error: function () {
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.send.path_status = "error";
              });
            });
          },
          success: function (data) {
            $scope.$apply(function () {
              if (!data || !data.quote || !Array.isArray(data.quote.send) ||
                  !data.quote.send.length || !data.quote.address) {
                $scope.send.path_status = "error";
                return;
              }

              var amount = Amount.from_json(data.quote.send[0]);

              send.bitcoin_quote = data.quote;

              // We have a quote, now calculate a path
              send.recipient_actual = data.quote.address;
              send.amount_actual = amount;

              $scope.update_paths();
            });
          }
        });
      } catch (e) {
        console.exception(e);
        $scope.send.path_status = "error";
      }
    };

    $scope.reset_paths = function () {
      var send = $scope.send;
      if (!$scope.need_paths_update()) return;

      send.alternatives = [];
    };

    /**
     * Determine if we need to update the paths.
     *
     * Checks if the parameters for the path find have changed.
     */
    $scope.need_paths_update = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;
      var currency = send.currency;
      var amount = send.amount_actual || send.amount_feedback;

      var modified = send.last_am_recipient !== recipient ||
        !send.last_amount ||
        !send.last_amount.is_valid() ||
        !amount.is_valid() ||
        !amount.equals(send.last_amount);

      return modified;
    };

    $scope.update_paths = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;
      var currency = send.currency;
      var amount = send.amount_actual || send.amount_feedback;

      if (!$scope.need_paths_update()) return;

      $scope.reset_paths();

      // Note that last_am_recipient and last_recipient are intentionally
      // separate, the former is the last recipient that update_paths used.
      send.last_am_recipient = recipient;
      send.last_amount = send.amount_feedback;

      send.path_status = 'pending';

      // Start path find
      var pf = $network.remote.path_find($id.account,
                                         recipient,
                                         amount);

      pf.on('update', function (upd) {
        $scope.$apply(function () {
          if (!upd.alternatives || !upd.alternatives.length) {
            $scope.send.path_status = "no-path";
          } else {
            var currentKey;
            $scope.send.path_status = "done";
            $scope.send.alternatives = _.map(upd.alternatives, function (raw,key) {
              var alt = {};
              alt.amount = Amount.from_json(raw.source_amount);
              alt.send_max = alt.amount.product_human(Amount.from_json('1.01'));
              alt.paths = raw.paths_computed
                ? raw.paths_computed
                : raw.paths_canonical;

              // Selected currency should be the first option
              if (raw.source_amount.currency) {
                if (raw.source_amount.currency == $scope.send.currency_code)
                  currentKey = key;
              } else if ($scope.send.currency_code == 'XRP') {
                currentKey = key;
              }

              return alt;
            });

            if (currentKey)
              $scope.send.alternatives.splice(0, 0, $scope.send.alternatives.splice(currentKey, 1)[0]);
          }
        });
      });

      pf.on('error', function (err) {
        setImmediate(function () {
          $scope.$apply(function () {
            send.path_status = "error";
          });
        });
      });
    };

    $scope.handle_paths = function (data) {
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
    };

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.recipient_query = webutil.queryFromOptions(contacts);
    }, true);
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

    $scope.$watch('account.max_spend', function () {
      $scope.update_amount();
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
        currency_choices: $scope.currencies_all,
        currency_code: "XRP",
        path_status: 'waiting',
        fund_status: 'none',
        sender_insufficient_xrp: false
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
      // Source tag
      if ($scope.send.st) {
        tx.source_tag($scope.send.st);
      }

      if (!$scope.send.bitcoin) {
        // Destination tag
        tx.destination_tag(+dt);

        tx.payment($id.account, addr, amount.to_json());
      } else {
        if ("number" === typeof $scope.send.bitcoin_quote.destination_tag) {
          tx.destination_tag($scope.send.bitcoin_quote.destination_tag);
        }

        var encodedAddr = Base.decode(addr, 'bitcoin');
        encodedAddr = sjcl.codec.bytes.toBits(encodedAddr);
        encodedAddr = sjcl.codec.hex.fromBits(encodedAddr).toUpperCase();
        while (encodedAddr.length < 64) encodedAddr += "0";
        tx.tx_json.InvoiceID = encodedAddr;

        tx.payment($id.account,
                   $scope.send.bitcoin_quote.address,
                   $scope.send.bitcoin_quote.send[0]);
      }

      if ($scope.send.alt) {
        tx.send_max($scope.send.alt.send_max);
        tx.paths($scope.send.alt.paths);
      } else {
        if (!amount.is_native()) {
          tx.build_path(true);
        }
      }
      tx.on('proposed', function (res) {
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
