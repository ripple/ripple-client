var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base,
    RippleError = ripple.RippleError;

var SendTab = function ()
{
  Tab.call(this);
};

util.inherits(SendTab, Tab);

SendTab.prototype.tabName = 'send';
SendTab.prototype.mainMenu = 'send';

SendTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['federation', 'keychain', 'authinfo']);

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angular = function (module)
{
  module.controller('SendCtrl', ['$scope', '$timeout', '$routeParams', 'rpId',
                                 'rpNetwork', 'rpFederation', 'rpTracker',
                                 'rpKeychain', 'rpAuthInfo',
                                 function ($scope, $timeout, $routeParams, $id,
                                           $network, $federation, $rpTracker,
                                           keychain, authInfo)
  {
    if (!$id.loginStatus) return $id.goId();

    var timer;

    // XRP currency object.
    // {name: "XRP - Ripples", order: 146, value: "XRP"}
    $scope.xrp = _.where($scope.currencies_all, {value: "XRP"})[0];

    $scope.$watch('send.recipient', function(){
      // raw address without any parameters
      var address = webutil.stripRippleAddress($scope.send.recipient);

      $scope.contact = webutil.getContact($scope.userBlob.data.contacts, address);

      // Sets
      // send.recipient, send.recipient_name, send.recipient_address, send.dt.
      if ($scope.contact) {
        if ($scope.send.recipient === $scope.contact.address) {
          $scope.send.recipient = $scope.contact.name;
        }
        $scope.send.recipient_name = $scope.contact.name;
        $scope.send.recipient_address = $scope.contact.address;

        if ($scope.contact.dt) {
          $scope.send.dt = $scope.contact.dt;
        }
      }
      else {
        $scope.send.recipient_name = '';
        $scope.send.recipient_address = address;
      }

      $scope.update_destination();
    }, true);

    $scope.$watch('send.currency', function () {
      $scope.send.currency_code = ripple.Currency.from_json($scope.send.currency).to_human().toUpperCase();
      $scope.update_currency();
    }, true);

    $scope.$watch('send.amount', function () {
      $scope.update_amount();
    }, true);

    $scope.$watch('send.extra_fields', function () {
      $scope.update_amount();
    }, true);

    // When the send form is invalid, path finding won't trigger. So if the form
    // is changed by one of the update_* handlers and becomes valid during the
    // next digest, we need to manually trigger another update_amount.
    $scope.$watch('sendForm.$valid', function () {
      $scope.update_amount();
    });

    var destUpdateTimeout;

    // Reset everything that depends on the destination
    $scope.reset_destination_deps = function() {
      var send = $scope.send;
      send.self = false;
      send.quote_url = false;
      send.federation = false;
      send.fund_status = "none";
      send.extra_fields = [];

      // Reset federation address validity status
      $scope.sendForm.send_destination.$setValidity("federation", true);

      // Now starting to work on resolving the recipient
      send.recipient_resolved = false;

      $scope.reset_currency_deps();
    };

    $scope.check_dt_visibility = function () {
      var send = $scope.send;

      send.show_dt_field = ($routeParams.dt
        || send.dt
        || send.recipient_info.dest_tag_required)
          && !send.federation;
    };

    $scope.update_destination = function () {
      var send = $scope.send;
      var recipient = send.recipient_address;

      if (recipient === send.last_recipient) return;

      // Trying to send to a Bitcoin address
      if (!isNaN(Base.decode_check([0, 5], recipient, 'bitcoin'))) {
        if (Options.bridge.out.bitcoin) { // And there is a default bridge
          recipient += '@' + Options.bridge.out.bitcoin
          send.recipient_address = recipient
        }
      }

      send.last_recipient = recipient;

      $scope.reset_destination_deps();

      // Trying to send XRP to self.
      // This is used to disable 'Send XRP' button
      send.self = recipient === $scope.address;

      // Trying to send to a Ripple name
      send.rippleName = webutil.isRippleName(recipient);

      // Trying to send to an email/federation address
      send.federation = ("string" === typeof recipient) && ~recipient.indexOf('@');

      // Check destination tag visibility
      $scope.check_dt_visibility();

      if (destUpdateTimeout) $timeout.cancel(destUpdateTimeout);
      destUpdateTimeout = $timeout($scope.update_destination_remote, 500);
    };

    $scope.update_destination_remote = function () {
      var send = $scope.send;
      var recipient = send.recipient_address;

      // Reset federation address validity status
      if ($scope.sendForm && $scope.sendForm.send_destination)
        $scope.sendForm.send_destination.$setValidity("federation", true);

      if (send.federation) {
        send.path_status = "fed-check";
        $federation.check_email(recipient)
          .then(function (result) {
            // Check if this request is still current, exit if not
            var now_recipient = send.recipient_actual || send.recipient_address;
            if (recipient !== now_recipient) return;

            send.federation_record = result;

            if (result.extra_fields) {
              send.extra_fields = result.extra_fields;
            }

            send.dt = ("number" === typeof result.dt) ? result.dt : undefined;

            if (result.destination_address) {
              // Federation record specifies destination
              send.recipient_name = recipient;
              send.recipient_address = result.destination_address;

              $scope.check_destination();
            } else if (result.quote_url) {
              // Federation destination requires us to request a quote
              send.quote_url = result.quote_url;
              send.quote_destination = result.destination;
              send.path_status = "waiting";
              $scope.update_currency_constraints();
            } else {
              // Invalid federation result
              send.path_status = "waiting";
              $scope.sendForm.send_destination.$setValidity("federation", false);
              // XXX Show specific error message
            }
          }, function () {
            // Check if this request is still current, exit if not
            var now_recipient = send.recipient_actual || send.recipient_address;
            if (recipient !== now_recipient) return;

            send.path_status = "waiting";
            $scope.sendForm.send_destination.$setValidity("federation", false);
          })
        ;
      }
      else if (send.rippleName) {
        authInfo.get(Options.domain,send.recipient,function(err, response){
          send.recipient_name = '~' + response.username;
          send.recipient_address = response.address;

          $scope.check_destination();
        })
      }
      else {
        $scope.check_destination();
      }
    };

    // Check destination for XRP sufficiency and flags
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
            if (e.remote.error === "actNotFound") {
              send.recipient_info = {
                'loaded': true,
                'exists': false,
                'Balance': "0"
              };
              $scope.update_currency_constraints();
            } else {
              // XXX Actual error
            }
          } else {
            send.recipient_info = {
              'loaded': true,
              'exists': true,
              'Balance': data.account_data.Balance,

              // Flags
              'disallow_xrp': data.account_data.Flags & ripple.Remote.flags.account_root.DisallowXRP,
              'dest_tag_required': data.account_data.Flags & ripple.Remote.flags.account_root.RequireDestTag
            };

            // Check destination tag visibility
            $scope.check_dt_visibility();

            if (!$scope.account || !$scope.account.reserve_base) return;

            var reserve_base = $scope.account.reserve_base;
            send.xrp_deficiency = reserve_base.subtract(data.account_data.Balance);

            send.recipient_lines = false;
            $scope.update_currency_constraints();
          }
        });
      });
    };

    /**
     * Update any constraints on what currencies the user can select.
     *
     * In many modes, the user is restricted in terms of what they can send.
     * For example, when sending to a Bitcoin address, they can only send BTC.
     *
     * This function checks those conditions and updates the UI.
     */
    $scope.update_currency_constraints = function () {
      var send = $scope.send;

      // Reset constraints
      send.currency_choices = $scope.currencies_all;
      send.currency_force = false;

      // Federation response can specific a fixed amount
      if (send.federation_record &&
          "undefined" !== typeof send.federation_record.amount) {
        send.force_amount = Amount.from_json(send.federation_record.amount);
        send.amount = send.force_amount.to_text();
        send.currency_choices = [send.force_amount.currency().to_json()];
        send.currency_force = send.force_amount.currency().to_json();
        send.currency = send.currency_force;
      }

      // Apply federation currency restrictions
      if (send.federation_record &&
          $.isArray(send.federation_record.currencies) &&
          send.federation_record.currencies.length >= 1 &&
          "object" === typeof send.federation_record.currencies[0] &&
          "string" === typeof send.federation_record.currencies[0].currency) {
        // XXX Do some validation on this
        send.currency_choices = [];
        $.each(send.federation_record.currencies, function () {
          send.currency_choices.push(this.currency);
        });
        send.currency_force = send.currency_choices[0];
        send.currency = send.currency_choices[0];
      }

      if (!send.recipient_info.loaded) return;

      if (send.recipient_info.exists) {
        // Check allowed currencies for this address
        $network.remote.request_account_currencies(send.recipient_address)
          .on('success', function (data) {
            if (data.receive_currencies) {
              $scope.update_currency_choices(data.receive_currencies);
            }
          })
          .on('error', function () {})
          .request();
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

    $scope.update_currency_choices = function(receive_currencies) {

      $scope.$apply(function () {
        // Generate list of accepted currencies
        var currencies = _.uniq(_.compact(_.map(receive_currencies, function (currency) {
          return currency;
        })));

        // add XRP if it's allowed
        if (!$scope.send.recipient_info.disallow_xrp) {
          currencies.unshift('XRP');
        }

        // create a currency object for each of the currency codes
        for (var i=0; i < currencies.length; i++) {
          currencies[i] = ripple.Currency.from_json(currencies[i]);
        }

        // create the display version of the currencies
        currencies = _.map(currencies, function (currency) {
          if ($scope.currencies_all_keyed[currency._iso_code]) {
            return currency.to_human({full_name:$scope.currencies_all_keyed[currency._iso_code].name});
          } else {
            return currency.to_human();
          }
        });

        $scope.send.currency_choices = currencies;
        $scope.send.currency_code = currencies[0]._iso_code;
        $scope.send.currency = currencies[0];
      });
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

      $scope.update_amount();
    };

    var pathUpdateTimeout;

    $scope.reset_amount_deps = function () {
      var send = $scope.send;
      send.sender_insufficient_xrp = false;
      send.quote = false;

      $scope.reset_paths();
    };

    $scope.update_amount = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;
      var match = /^([a-zA-Z0-9]{3}|[A-Fa-f0-9]{40})\b/.exec(send.currency);
      if (!match) {
        // Currency code not recognized, should have been caught by
        // form validator.
        return;
      }

      var currency = match[0];

      // Demurrage: Get a reference date five minutes in the future
      //
      // Normally, when using demurrage currencies, we would immediately round
      // down (e.g. 0.99999 instead of 1) as demurrage occurs continuously. Not
      // a good user experience.
      //
      // By choosing a date in the future, this gives us a time window before
      // this rounding down occurs. Note that for positive interest currencies
      // this actually *causes* the same odd rounding problem, so in the future
      // we'll want a better solution, but for right now this does what we need.
      var refDate = new Date(new Date().getTime() + 5 * 60000);
      var amount = send.amount_feedback = ripple.Amount.from_human('' + send.amount + ' ' + currency.toUpperCase(), { reference_date: refDate });

      $scope.reset_amount_deps();
      send.path_status = 'waiting';

      // If there is a timeout in progress, we want to cancel it, since the
      // inputs have changed.
      if (pathUpdateTimeout) $timeout.cancel(pathUpdateTimeout);

      // If the form is invalid, we won't be able to submit anyway, so no point
      // in calculating paths.
      if ($scope.sendForm.$invalid) return;

      if (send.quote_url) {
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
        send.sender_insufficient_xrp = send.amount_feedback.is_native()
          && $scope.account.max_spend
          && $scope.account.max_spend.to_number() > 1
          && $scope.account.max_spend.compareTo(send.amount_feedback) < 0;

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
      var recipient = send.recipient_actual || send.recipient_address;

      $scope.reset_paths();

      try {
        // Get a quote
        send.path_status = "bridge-quote";

        var data = {
          type: "quote",
          amount: send.amount_feedback.to_text()+"/"+send.amount_feedback.currency().to_json(),
          destination: send.quote_destination,
          address: $scope.address
        };

        if ($.isArray(send.extra_fields)) {
          $.each(send.extra_fields, function () {
            data[this.name] = this.value;
          });
        }

        $.ajax({
          url: send.quote_url,
          dataType: 'json',
          data: data,
          error: function () {
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.send.path_status = "error-quote";
              });
            });
          },
          success: function (data) {
            $scope.$apply(function () {
              // Check if this request is still current, exit if not
              var now_recipient = send.recipient_actual || send.recipient_address;
              if (recipient !== now_recipient) return;

              var now_amount = send.amount_feedback;
              if (!now_amount.equals(send.amount_feedback)) return;

              if (!data || !data.quote ||
                  !(data.result === "success" || data.status === "success") ||
                  !Array.isArray(data.quote.send) ||
                  !data.quote.send.length || !data.quote.address) {
                $scope.send.path_status = "error-quote";
                $scope.send.quote_error = "";
                if (data && data.result === "error" &&
                    "string" === typeof data.error_message) {
                  $scope.send.quote_error = data.error_message;
                }
                return;
              }

              var amount = Amount.from_json(data.quote.send[0]);

              send.quote = data.quote;

              // We have a quote, now calculate a path
              send.recipient_actual = data.quote.address;
              send.amount_actual = amount;

              $scope.update_paths();
            });
          }
        });
      } catch (e) {
        console.error(e.stack ? e.stack : e);
        $scope.send.path_status = "error-quote";
      }
    };

    $scope.reset_paths = function () {
      var send = $scope.send;

      send.alternatives = [];
    };

    $scope.update_paths = function () {
      var send = $scope.send;
      var recipient = send.recipient_actual || send.recipient_address;
      var amount = send.amount_actual || send.amount_feedback;
      var tracked;

      $scope.reset_paths();

      // Note that last_am_recipient and last_recipient are intentionally
      // separate, the former is the last recipient that update_paths used.
      send.last_am_recipient = recipient;
      send.last_amount = send.amount_feedback;

      send.path_status = 'pending';

      // Determine if we need to update the paths.
      if (send.pathfind &&
          send.pathfind.src_account === $id.account &&
          send.pathfind.dst_account === recipient &&
          send.pathfind.dst_amount.equals(amount))
        return;

      // Start path find
      var pf = $network.remote.path_find($id.account,
                                         recipient,
                                         amount);

      send.pathfind = pf;

      var lastUpdate;

      pf.on('update', function (upd) {
        $scope.$apply(function () {
          lastUpdate = new Date();

          clearInterval(timer);
          timer = setInterval(function(){
            $scope.$apply(function(){
              var seconds = Math.round((new Date() - lastUpdate)/1000);
              $scope.lastUpdate = seconds ? seconds : 0;
            })
          }, 1000);

          // Check if this request is still current, exit if not
          var now_recipient = send.recipient_actual || send.recipient_address;
          if (recipient !== now_recipient) return;

          var now_amount = send.amount_actual || send.amount_feedback;
          if (!now_amount.equals(amount)) return;

          if (!upd.alternatives || !upd.alternatives.length) {
            $scope.send.path_status  = "no-path";
            $scope.send.alternatives = [];
          } else {
            var currentKey;
            $scope.send.path_status  = "done";
            $scope.send.alternatives = _.map(upd.alternatives, function (raw,key) {
              var alt = {};
              alt.amount   = Amount.from_json(raw.source_amount);

              // Compensate for demurrage
              //
              // In the case of demurrage, the amount would immediately drop
              // below where it is and because we currently always round down it
              // would immediately show up as something like 0.99999.
              var slightlyInFuture = new Date(+new Date() + 5 * 60000);

              alt.rate     = alt.amount.ratio_human(amount, {reference_date: slightlyInFuture});
              alt.send_max = alt.amount.product_human(Amount.from_json('1.01'));
              alt.paths    = raw.paths_computed
                ? raw.paths_computed
                : raw.paths_canonical;

              // Selected currency should be the first option
              if (raw.source_amount.currency) {
                if (raw.source_amount.currency === $scope.send.currency_code)
                  currentKey = key;
              } else if ($scope.send.currency_code === 'XRP') {
                currentKey = key;
              }

              return alt;
            });

            if (currentKey)
              $scope.send.alternatives.splice(0, 0, $scope.send.alternatives.splice(currentKey, 1)[0]);
          }

          if (!tracked) {
            $rpTracker.track('Send pathfind', {
              'Status': 'success',
              'Currency': $scope.send.currency_code,
              'Address Type': $scope.send.federation ? 'federation' : 'ripple',
              'Destination Tag': !!$scope.send.dt,
              'Paths': upd.alternatives.length,
              'Time': (+new Date() - +pathFindTime) / 1000
            });

            tracked = true;
          }
        });
      });

      pf.on('error', function (res) {
        setImmediate(function () {
          $scope.$apply(function () {
            send.path_status = "error";
          });
        });

        $rpTracker.track('Send pathfind', {
          'Status': 'error',
          'Message': res.engine_result,
          'Currency': $scope.send.currency_code,
          'Address Type': $scope.send.federation ? 'federation' : 'ripple',
          'Destination Tag': !!$scope.send.dt
        })
      });

      var pathFindTime = new Date();
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
      $scope.recipient_query = webutil.queryFromContacts(contacts);
    }, true);

    // update currency options based on existing trust lines
    // the user can only send the currencies for which there exists trustlines
    $scope.$watch('lines', function (lines) {

      // create a list of currency codes from the trust line objects
      var currencies = _.uniq(_.map(lines, function (line) {
        return line.currency;
      }));

      // add XRP if it's allowed
      if (!$scope.send.recipient_info.disallow_xrp) {
        currencies.unshift('XRP');
      }

      // create a currency object for each of the currency codes
      for (var i=0; i < currencies.length; i++) {
        currencies[i] = ripple.Currency.from_json(currencies[i]);
      }

      // create the display version of the currencies
      currencies = _.map(currencies, function (currency) {
        if ($scope.currencies_all_keyed[currency._iso_code]) {
          return currency.to_human({full_name:$scope.currencies_all_keyed[currency._iso_code].name});
        }
      });

      $scope.send.currency_choices = currencies;
      $scope.send.currency_code = currencies[0]._iso_code;
      $scope.send.currency = currencies[0];

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
        recipient_info: {},
        amount: '',
        amount_prev: new Amount(),
        currency: $scope.xrp.name,
        currency_choices: [],
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

      // Force pathfinding reset
      $scope.send.last_am_recipient = null;
      $scope.update_paths();
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

      // Stop the pathfind - once we're on the confirmation page, we'll freeze
      // the last state we had so the user doesn't get surprises when
      // submitting.
      // XXX ST: The confirmation page should warn you somehow once it becomes
      //         outdated.
      if ($scope.send.pathfind) {
        $scope.send.pathfind.close();
        delete $scope.send.pathfind;
      }

      $scope.mode = "confirm";

      if (keychain.isUnlocked($id.account)) {
        $scope.send.secret = keychain.getUnlockedSecret($id.account);
      }

      $rpTracker.track('Send confirmation page', {
        'Currency': $scope.send.currency_code,
        'Address Type': $scope.send.federation ? 'federation' : 'ripple',
        'Destination Tag': !!$scope.send.dt
      })
    };

    /**
     * N4. Waiting for transaction result page
     */

    $scope.onTransactionProposed = function (res, tx) {
      $scope.$apply(function () {
        $scope.setEngineStatus(res, false);
        $scope.sent(tx.hash);

        // Remember currency and increase order
        var found;

        for (var i = 0; i < $scope.currencies_all.length; i++) {
          if ($scope.currencies_all[i].value.toLowerCase() === $scope.send.amount_feedback.currency().to_human().toLowerCase()) {
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
    };

    $scope.onTransactionSuccess = function (res, tx) {
      $scope.$apply(function () {
        $scope.setEngineStatus(res, true);
      });
    };

    $scope.onTransactionError = function (res, tx) {
      setImmediate(function () {
        $scope.$apply(function () {
          $scope.mode = "error";

          if (res.engine_result) {
            $scope.setEngineStatus(res);
          } else if (res.error === 'remoteError') {
            $scope.error_type = res.remote.error;
          } else {
            $scope.error_type = "unknown";
          }
        });
      });
    };

    $scope.send_confirmed = function () {
      var send = $scope.send;
      var currency = $scope.send.currency.slice(0, 3).toUpperCase();
      var amount = send.amount_feedback;
      var address = $scope.send.recipient_address;

      $scope.mode = "sending";

      amount.set_issuer(address);

      var tx = $network.remote.transaction();
      // Source tag
      if ($scope.send.st) {
        tx.source_tag($scope.send.st);
      }

      if (send.secret) {
        tx.secret(send.secret);
      } else {
        // Get secret asynchronously
        keychain.getSecret($id.account, $id.username, send.unlock_password,
                           function (err, secret) {
                             if (err) {
                               console.log("client: send tab: error while " +
                                           "unlocking wallet: ", err);
                               $scope.mode = "error";
                               $scope.error_type = "unlockFailed";
                               return;
                             }

                             send.secret = secret;
                             $scope.send_confirmed();
                           });
        return;
      }

      if ($scope.send.quote) {
        if ("number" === typeof $scope.send.quote.destination_tag) {
          tx.destination_tag($scope.send.quote.destination_tag);
        }

        if ("string" === typeof $scope.send.quote.invoice_id) {
          tx.tx_json.InvoiceID = $scope.send.quote.invoice_id.toUpperCase();
        }

        tx.payment($id.account,
                   $scope.send.quote.address,
                   $scope.send.quote.send[0]);
      } else {
        // Destination tag
        var dt;
        if ($scope.send.dt) {
          dt = $scope.send.dt;
        } else {
          dt = webutil.getDestTagFromAddress($scope.send.recipient);
        }

        tx.destination_tag(dt ? +dt : undefined); // 'cause +dt is NaN when dt is undefined

        tx.payment($id.account, address, amount.to_json());
      }

      if ($scope.send.alt) {
        tx.send_max($scope.send.alt.send_max);
        tx.paths($scope.send.alt.paths);
      } else {
        if (!amount.is_native()) {
          tx.build_path(true);
        }
      }

      var maxLedger = Options.tx_last_ledger || 3;
      tx.lastLedger($network.remote._ledger_current_index + maxLedger);

      tx.on('success', function (res) {
        $scope.onTransactionSuccess(res, tx);

        $rpTracker.track('Send result', {
          'Status': 'success',
          'Currency': $scope.send.currency_code,
          'Address Type': $scope.send.federation ? 'federation' : 'ripple',
          'Destination Tag': !!$scope.send.dt,
          'Time': (+new Date() - +$scope.confirmedTime) / 1000
        })
      });

      tx.on('proposed', function (res) {
        $scope.onTransactionProposed(res, tx);
      });

      tx.on('error', function (res) {
        $scope.onTransactionError(res, tx);

        $rpTracker.track('Send result', {
          'Status': 'error',
          'Message': res.engine_result,
          'Currency': $scope.send.currency_code,
          'Address Type': $scope.send.federation ? 'federation' : 'ripple',
          'Destination Tag': !!$scope.send.dt,
          'Time': (+new Date() - +$scope.confirmedTime) / 1000
        });
      });

      tx.submit();

      $scope.confirmedTime = new Date();
    };

    /**
     * N5. Sent page
     */
    $scope.sent = function (hash) {
      $scope.mode = "status";
      $network.remote.on('transaction', handleAccountEvent);

      function handleAccountEvent(e) {
        $scope.$apply(function () {
          if (e.transaction.hash === hash) {
            $scope.setEngineStatus(e, true);
            $network.remote.removeListener('transaction', handleAccountEvent);
          }
        });
      }
    };

    $scope.setEngineStatus = function(res, accepted) {
      $scope.engine_result = res.engine_result;
      $scope.engine_result_message = res.engine_result_message;
      $scope.engine_status_accepted = !!accepted;
      $scope.mode = "status";
      $scope.tx_result = "partial";
      switch (res.engine_result.slice(0, 3)) {
        case 'tes':
          $scope.mode = "status";
          $scope.tx_result = accepted ? "cleared" : "pending";
          break;
        case 'tep':
          $scope.mode = "status";
          $scope.tx_result = "partial";
          break;
        default:
          $scope.mode = "rippleerror";
      }
    };

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        name: $scope.saveAddressName,
        view: $scope.send.recipient,
        address: $scope.send.recipient_address
      };

      $scope.userBlob.unshift('/contacts', contact, function(err, data){
        if (err) {
          console.log("Can't save the contact. ", err);
          return;
        }

        $scope.contact = data;
        $scope.addressSaved = true;
      });
    };

    $scope.$on("$destroy", function () {
      // Stop pathfinding if the user leaves the tab
      if ($scope.send.pathfind) {
        $scope.send.pathfind.close();
        delete $scope.send.pathfind;
      }
    });

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
          var unique = !webutil.getContact($scope.userBlob.data.contacts,value);
          ctrl.$setValidity('unique', unique);
          if (unique) return value;
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
