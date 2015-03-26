var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Currency = ripple.Currency,
    Base = ripple.Base,
    RippleError = ripple.RippleError;

var SendTab = function ()
{
  Tab.call(this);
};

util.inherits(SendTab, Tab);

SendTab.prototype.tabName = 'send';
SendTab.prototype.mainMenu = 'send';

SendTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['federation', 'keychain']);

SendTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/send.jade')();
};

SendTab.prototype.angular = function (module)
{
  module.controller('SendCtrl', ['$scope', '$timeout', '$routeParams', 'rpId',
                                 'rpNetwork', 'rpFederation', 'rpTracker',
                                 'rpKeychain', '$interval',
                                 function ($scope, $timeout, $routeParams, id,
                                           network, federation, rpTracker,
                                           keychain, $interval)
  {
    var destUpdateTimeout,
        passwordUpdater,
        passwordUpdaterDestr;

    var timer;
    var xrpCurrency = Currency.from_json('XRP');

    $scope.xrp = {
      name: xrpCurrency.to_human({full_name:$scope.currencies_all_keyed.XRP.name}),
      code: xrpCurrency.get_iso(),
      currency: xrpCurrency
    };

    $scope.$watch('send.recipient', function(rec){
      if (!rec) return;
      // raw address without any parameters
      var address = webutil.stripRippleAddress($scope.send.recipient);
      var dt = webutil.getDestTagFromAddress($scope.send.recipient);

      if (dt) {
        $scope.send.dt = dt;
      }

      $scope.contact = webutil.getContact($scope.userBlob.data.contacts, address);

      // Sets
      // send.recipient, send.recipient_name, send.recipient_address, send.dt.
      if ($scope.contact) {
        if ($scope.send.recipient === $scope.contact.address) {
          $scope.send.recipient = $scope.contact.name;
        }
        $scope.send.recipient_name = $scope.contact.name;
        $scope.send.recipient_address = $scope.contact.address;

        if ($scope.contact.dt && !dt) {
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
      var currency = ripple.Currency.from_json($scope.send.currency);
      if ($scope.send.currency !== '' && currency.is_valid()) {
        $scope.send.currency_code = currency.to_human().toUpperCase();
      } else {
        $scope.send.currency_code = '';
      }
      $scope.update_currency();

      setImmediate(function() {
        if ($scope.sendForm && $scope.sendForm.send_amount !== undefined) {
          $scope.$apply(function() {
            $scope.sendForm.send_amount.$setViewValue($scope.send.amount);
            $scope.sendForm.send_amount.$validate();
            $scope.update_amount();
          });
        }
      });
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

    // Reset everything that depends on the destination
    $scope.reset_destination_deps = function() {
      var send = $scope.send;
      send.self = false;
      send.quote_url = false;
      send.federation = false;
      send.fund_status = 'none';
      send.extra_fields = [];

      // Reset federation address validity status
      if ($scope.sendForm && $scope.sendForm.send_destination) {
        $scope.sendForm.send_destination.$setValidity('federation', true);
        $scope.sendForm.send_destination.$setValidity('federationDown', true);
        $scope.sendForm.send_destination.$setValidity('btcBridgeWrong', true);
      }

      // Now starting to work on resolving the recipient
      send.recipient_resolved = false;
      send.recipient_actual = void(0);
      send.amount_actual = void(0);

      $scope.reset_currency_deps();
    };

    $scope.check_dt_visibility = function () {
      var send = $scope.send;

      send.show_dt_field =
          ($routeParams.dt
          || send.dt
          || (send.recipient_info &&
          'object' === typeof send.recipient_info &&
          send.recipient_info.dest_tag_required))
          && (!send.federation || (send.federation_record && !send.federation_record.dt));
    };

    $scope.update_destination = function () {
      var send = $scope.send;
      var recipient = send.recipient_address;

      if (recipient === send.last_recipient) return;

      send.toBitcoin = false;
      // Trying to send to a Bitcoin address
      if (!isNaN(Base.decode_check([0, 5], recipient, 'bitcoin'))) {
        if (Options.bridge.out.bitcoin) { // And there is a default bridge
          recipient += '@' + Options.bridge.out.bitcoin;
          send.recipient_address = recipient;
          send.toBitcoin = true;
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
      send.federation = ('string' === typeof recipient) && ~recipient.indexOf('@');

      // Check destination tag visibility
      $scope.check_dt_visibility();

      if (destUpdateTimeout) $timeout.cancel(destUpdateTimeout);
      destUpdateTimeout = $timeout($scope.update_destination_remote, 500);
    };

    $scope.update_destination_remote = function () {
      var send = $scope.send;
      var recipient = send.recipient_address;
      var strippedRecipient = webutil.stripRippleAddress(send.recipient);
      var isRecipientValidAddress = ripple.UInt160.is_valid(strippedRecipient);

      // Reset federation address validity status
      if ($scope.sendForm && $scope.sendForm.send_destination) {
        $scope.sendForm.send_destination.$setValidity('federation', true);
        $scope.sendForm.send_destination.$setValidity('federationDown', true);
        $scope.sendForm.send_destination.$setValidity('btcBridgeWrong', true);
      }

      // If there was a previous federation request, we need to clean it up here.
      if (send.federation_record) {
        send.federation_record = null;
        send.dt = null;
      }

      if (send.federation) {
        send.path_status = 'fed-check';
        federation.check_email(recipient)
          .then(function (result) {
            // Check if this request is still current, exit if not
            var now_recipient = send.recipient_address;
            if (recipient !== now_recipient) return;

            send.federation_record = result;

            if (result.extra_fields) {
              send.extra_fields = result.extra_fields;
            }

            send.dt = ('number' === typeof result.dt) ? result.dt : undefined;

            if (result.destination_address) {
              // Federation record specifies destination
              send.recipient_name = recipient;
              send.recipient_address = result.destination_address;

              $scope.check_destination();
            } else if (result.quote_url) {
              send.recipient_info = {};
              // Federation destination requires us to request a quote
              send.quote_url = result.quote_url;
              send.quote_destination = result.destination;
              send.path_status = 'waiting';
              $scope.update_currency_constraints();
            } else {
              // Invalid federation result
              send.path_status = 'waiting';
              $scope.sendForm.send_destination.$setValidity('federation', false);
              // XXX Show specific error message
            }
          }, function (error) {
            // Check if this request is still current, exit if not
            var now_recipient = send.recipient_actual || send.recipient_address;
            if (recipient !== now_recipient) return;

            send.path_status = 'waiting';
            if (send.toBitcoin && Options.bridge.out.bitcoin != 'btc2ripple.com') {
              $scope.sendForm.send_destination.$setValidity('btcBridgeWrong', false);
            } else if (error && error.error === 'down') {
              $scope.sendForm.send_destination.$setValidity('federationDown', false);
              // super simple URL parsing to get only path
              var url = error.url.split('/').slice(0, 3).join('/');
              $scope.send.federationURL = url;
            } else {
              $scope.sendForm.send_destination.$setValidity('federation', false);
            }
          })
        ;
      }
      else if (send.rippleName) {
        rippleVaultClient.AuthInfo.get(Options.domain, send.recipient, function(err, response) {
          $scope.$apply(function(){
            send.recipient_name = '~' + response.username;
            send.recipient_address = response.address;
          });

          $scope.check_destination();
        });
      }
      else if (isRecipientValidAddress && send.recipient_address == strippedRecipient) {
        id.resolveName(strippedRecipient, { tilde: true }).then(function(name) {
          send.recipient_name = name;
          if (send.recipient == name) {
            // there is no name for this address
            $scope.check_destination();
          } else {
            // this will trigger update
            send.last_recipient = null;
            send.recipient = name;
          }
        }, function(err) {
          $scope.check_destination();
        });
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

      if (!$scope.account || !$scope.account.reserve_base) return;

      if (!send.federation && $scope.contact && $scope.contact.noDestinationCheck) {
        send.recipient_info = {
          loaded: true,
          exists: true,
          Balance: $scope.account.reserve_base,
          // Flags
          disallow_xrp: 0,
          dest_tag_required: 0
        };
        send.recipient_resolved = true;
        $scope.check_dt_visibility();
        send.recipient_lines = false;
        $scope.update_currency_constraints();
        return;
      }

      var account = network.remote.account(recipient);

      send.path_status = 'checking';
      send.recipient_info = null;
      account.entry(function (e, data) {
        $scope.$apply(function () {
          // Check if this request is still current, exit if not
          var now_recipient = send.recipient_actual || send.recipient_address;
          if (recipient !== now_recipient) return;

          // If we get this far, we have a Ripple address resolved
          send.recipient_resolved = true;

          if (e) {
            if (e.remote.error === 'actNotFound') {
              send.recipient_info = {
                loaded: true,
                exists: false,
                Balance: '0'
              };
              $scope.update_currency_constraints();
            } else {
              // XXX Actual error
            }
          } else {
            send.recipient_info = {
              loaded: true,
              exists: true,
              Balance: data.account_data.Balance,

              // Flags
              disallow_xrp: data.account_data.Flags & ripple.Remote.flags.account_root.DisallowXRP,
              dest_tag_required: data.account_data.Flags & ripple.Remote.flags.account_root.RequireDestTag
            };

            // Check destination tag visibility
            $scope.check_dt_visibility();

            if (!$scope.account || !$scope.account.reserve_base) return;

            var reserve_base = $scope.account.reserve_base;
            send.xrp_deficiency = reserve_base.subtract(data.account_data.Balance);

            if (!send.federation && $scope.contact &&
                !send.recipient_info.disallow_xrp &&
                !send.recipient_info.dest_tag_required &&
                send.xrp_deficiency.compareTo(0) <= 0) {
              // save to contact flag to not check destination next time
              $scope.userBlob.filter('/contacts', 'name', $scope.contact.name,
                                     'set', '/noDestinationCheck', true);
            }

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

      send.currency_choices_constraints = {};

      // Federation response can specific a fixed amount
      if (send.federation_record &&
          'undefined' !== typeof send.federation_record.amount) {
        send.force_amount = Amount.from_json(send.federation_record.amount);
        send.amount = send.force_amount.to_text();
        send.currency_choices_constraints.federation = [send.force_amount.currency().to_json()];

      // Apply federation currency restrictions
      } else if (send.federation_record &&
          $.isArray(send.federation_record.currencies) &&
          send.federation_record.currencies.length >= 1 &&
          'object' === typeof send.federation_record.currencies[0] &&
          'string' === typeof send.federation_record.currencies[0].currency) {
        // XXX Do some validation on this
        send.currency_choices_constraints.federation = [];
        $.each(send.federation_record.currencies, function () {
          send.currency_choices_constraints.federation.push(this.currency);
        });
      }

      // If this a bridge where we need a quote, we need to enter an
      // amount first, before we can even find out who the recipient is. So
      // if there is a quote_url, we want to bypass the recipient-based
      // constraints.
      if (send.quote_url) {
        $scope.update_currency_choices();
        return;
      }

      // If we don't have information about the recipient Ripple account yet,
      // we'll just return. We'll get back here once we have that information.
      if (!send.recipient_info.loaded) return;

      if (send.recipient_info.exists) {
        // Check allowed currencies for this address
        var requestedRecipientAddress = send.recipient_address;
        send.currency_choices_constraints.accountLines = 'pending';
        network.remote.requestAccountCurrencies({account: requestedRecipientAddress})
          .on('success', function (data) {
            $scope.$apply(function () {
              if (data.receive_currencies &&
                  // We need to make sure the destination account hasn't changed
                  send.recipient_address === requestedRecipientAddress) {
                send.currency_choices_constraints.accountLines = data.receive_currencies;

                // add XRP if it's allowed
                if (!$scope.send.recipient_info.disallow_xrp) {
                  send.currency_choices_constraints.accountLines.unshift('XRP');
                }

                $scope.update_currency_choices();
              }
            });
          })
          .on('error', function () {})
          .request();
      } else {
        // If the account doesn't exist, we can only send XRP
        send.currency_choices_constraints.accountLines = ['XRP'];
      }

      $scope.update_currency_choices();
    };

    // Generate list of accepted currencies
    $scope.update_currency_choices = function() {
      var send = $scope.send;

      var currencies = [];

      // Make sure none of the currency_choices_constraints are pending
      if (_.values(send.currency_choices_constraints).indexOf('pending') !== -1) {
        send.path_status = 'account-currencies';
        send.currency_choices = [];
        return;
      } else {
        // The possible currencies are the intersection of all provided currency
        // constraints.
        currencies = _.intersection.apply(_, _.values(send.currency_choices_constraints));
        currencies = _.uniq(_.compact(currencies));

        // create the display version of the currencies
        currencies = _.map(currencies, function (currency) {
         // create a currency object for each of the currency codes
          var currencyObj = ripple.Currency.from_json(currency);
          if ($scope.currencies_all_keyed[currencyObj.get_iso()]) {
            return currencyObj.to_human({full_name:$scope.currencies_all_keyed[currencyObj.get_iso()].name});
          } else {
            return currencyObj.to_human();
          }
        });
      }

      if (currencies.length === 1) {
        send.currency = send.currency_force = currencies[0];
      } else if (currencies.length === 0) {
        send.path_status = 'error-no-currency';
        send.currency = '';
      } else {
        send.currency_force = false;

        if (currencies.indexOf(send.currency) === -1) {
          send.currency = currencies[0];
        }
      }

      $scope.send.currency_choices = currencies;
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

      // We should have a valid recipient unless it's a quoting bridge, in
      // which case we should continue so we can request a quote.
      if (!ripple.UInt160.is_valid(recipient) && !send.quote_url) {
        return;
      }

      if (!send.currency_choices ||
          send.currency_choices.length === 0) {
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

      if (!send.currency_choices ||
          send.currency_choices.length === 0) {
        return;
      }

      var currency = ripple.Currency.from_human(send.currency);

      var matchedCurrency = currency.has_interest() ? currency.to_hex() : currency.get_iso();
      var match = /^([a-zA-Z0-9]{3}|[A-Fa-f0-9]{40})\b/.exec(matchedCurrency);

      if (!match) {
        // Currency code not recognized, should have been caught by
        // form validator.
        return;
      }

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
      var amount = send.amount_feedback = ripple.Amount.from_human('' + send.amount + ' ' + matchedCurrency, { reference_date: refDate });

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
          send.fund_status = 'insufficient-xrp';
          send.xrp_deficiency = reserve_base.subtract(send.recipient_info.Balance);
          send.insufficient = true;
          return;
        }
        send.insufficient = false;
        send.fund_status = 'none';

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
        send.path_status = 'bridge-quote';

        var data = {
          type: 'quote',
          amount: send.amount_feedback.to_text() + '/' + send.amount_feedback.currency().to_json(),
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
                $scope.send.pathfind.close();
                $scope.send.path_status = 'error-quote';
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
                  !(data.result === 'success' || data.status === 'success') ||
                  !Array.isArray(data.quote.send) ||
                  !data.quote.send.length || !data.quote.address) {
                $scope.send.pathfind.close();
                $scope.send.path_status = 'error-quote';
                $scope.send.quote_error = '';
                if (data && data.result === 'error' &&
                    'string' === typeof data.error_message) {
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
        console.error(e.stack || e);
        $scope.send.pathfind.close();
        $scope.send.path_status = 'error-quote';
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

      send.path_status = 'pending';

      // Determine if we need to update the paths.
      //if (send.pathfind &&
      //    send.pathfind.src_account === id.account &&
      //    send.pathfind.dst_account === recipient &&
      //    send.pathfind.dst_amount.equals(amount))
      //  return;

      // Start path find
      var pf = network.remote.path_find(id.account,
                                         recipient,
                                         amount,
                                         $scope.generate_src_currencies());
                                         //$scope.generate_src_currencies());
                                         // XXX: Roll back pathfinding changes temporarily
      var isIssuer = $scope.generate_issuer_currencies();

      send.pathfind = pf;
      send.pathfindJustStarted = true;

      var lastUpdate;

      pf.on('update', function (upd) {
        // wrong quote
        if ($scope.send.path_status === 'error-quote')
          return;

        // if no paths found and it is first update - skip it, it often wrong
        if (send.pathfindJustStarted && (!upd.alternatives || !upd.alternatives.length)) {
          send.pathfindJustStarted = false;
          return;
        }
        send.pathfindJustStarted = false;
        $scope.$apply(function () {
          lastUpdate = new Date();

          clearInterval(timer);
          timer = setInterval(function(){
            $scope.$apply(function(){
              var seconds = Math.round((new Date() - lastUpdate) / 1000);
              $scope.lastUpdate = seconds || 0;
            });
          }, 1000);

          // Check if this request is still current, exit if not
          var now_recipient = send.recipient_actual || send.recipient_address;
          if (recipient !== now_recipient) return;

          var now_amount = send.amount_actual || send.amount_feedback;
          if (!now_amount.equals(amount)) return;

          if (!upd.alternatives || !upd.alternatives.length) {
            $scope.send.path_status  = 'no-path';
            $scope.send.alternatives = [];
          } else {
            var currencies = {};
            var currentAlternatives = [];

            $scope.send.path_status  = 'done';
            $scope.send.alternatives = _.map(upd.alternatives, function (raw, key) {
              var alt = {};

              alt.amount   = Amount.from_json(raw.source_amount);

              // Compensate for demurrage
              //
              // In the case of demurrage, the amount would immediately drop
              // below where it is and because we currently always round down it
              // would immediately show up as something like 0.99999.
              var slightlyInFuture = new Date(+new Date() + 5 * 60000);

              alt.rate     = alt.amount.ratio_human(amount, {reference_date: slightlyInFuture});
              alt.send_max = alt.amount.product_human(Amount.from_human('1.001'));
              alt.paths    = raw.paths_computed || raw.paths_canonical;

              // Selected currency should be the first option
              if (raw.source_amount.currency) {
                if (raw.source_amount.currency === $scope.send.currency_code)
                  currentAlternatives.push(alt);
              } else if ($scope.send.currency_code === 'XRP') {
                currentAlternatives.push(alt);
              }

              if (alt.amount.issuer().to_json() != $scope.address && !isIssuer[alt.amount.currency().to_hex()]) {
                currencies[alt.amount.currency().to_hex()] = true;
              }

              return alt;
            }).filter(function(alt) { return currentAlternatives.indexOf(alt) == -1; });
            Array.prototype.unshift.apply($scope.send.alternatives, currentAlternatives);

            $scope.send.alternatives = $scope.send.alternatives.filter(function(alt) {
              // XXX: Roll back pathfinding changes temporarily
              if (currencies[alt.amount.currency().to_hex()]) {
                return alt.amount.issuer().to_json() != $scope.address;
              }
              return true;
            });
          }

          if (!tracked) {
            rpTracker.track('Send pathfind', {
              Status: 'success',
              Currency: $scope.send.currency_code,
              'Address Type': $scope.send.federation ? 'federation' : 'ripple',
              'Destination Tag': !!$scope.send.dt,
              Paths: upd.alternatives.length,
              Time: (+new Date() - +pathFindTime) / 1000,
              Address: $scope.userBlob.data.account_id
            });

            tracked = true;
          }
        });
      });

      pf.on('error', function (res) {
        setImmediate(function () {
          $scope.$apply(function () {
            send.path_status = 'error';
          });
        });

        rpTracker.track('Send pathfind', {
          Status: 'error',
          Message: res.engine_result,
          Currency: $scope.send.currency_code,
          'Address Type': $scope.send.federation ? 'federation' : 'ripple',
          'Destination Tag': !!$scope.send.dt,
          Address: $scope.userBlob.data.account_id
        });
      });

      var pathFindTime = new Date();
    };

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.recipient_query = webutil.queryFromContacts(contacts);
    }, true);

    $scope.$watch('account.max_spend', function () {
      $scope.update_amount();
    }, true);

    $scope.reset = function () {
      $scope.mode = 'form';

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
        currency_code: 'XRP',
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
      $scope.mode = 'form';
      $scope.send.alt = null;

      cleanPasswordUpdater();

      // Force pathfinding reset
      $scope.update_paths();

      if ($routeParams.abort_url) {
        document.location.replace($routeParams.abort_url);
      }
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

      // compute network fee
      $scope.networkFee = network.remote.transaction()._computeFee();

      if (keychain.isUnlocked(id.account)) {
        $scope.send.secret = keychain.getUnlockedSecret(id.account);
      }

      rpTracker.track('Send confirmation page', {
        'Currency': $scope.send.currency_code,
        'Address Type': $scope.send.federation ? 'federation' : 'ripple',
        'Destination Tag': !!$scope.send.dt,
        'Address': $scope.userBlob.data.account_id
      });

      if (Options.confirmation.send) {
        $scope.mode = 'confirm';
        cleanPasswordUpdater();

        // needed for password managers that don't raise change event on input field
        passwordUpdater = $interval(function() {
          var password = $('input[name="send_unlock_password"]').val();
          if (typeof password === 'string') {
            $scope.sendUnlockForm.send_unlock_password.$setViewValue(password);
          }
        }, 2000);

        passwordUpdaterDestr = $scope.$on('$destroy', function() {
          cleanPasswordUpdater();
        });
      } else {
        $scope.send_confirmed();
      }
    };

    function cleanPasswordUpdater() {
      if (typeof passwordUpdaterDestr === 'function') {
        passwordUpdaterDestr();
      }

      if (passwordUpdater) {
        $interval.cancel(passwordUpdater);
        passwordUpdater = null;
      }
    }

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
          if ($scope.currencies_all[i].value.toLowerCase() === $scope.send.amount_feedback.currency().get_iso().toLowerCase()) {
            $scope.currencies_all[i].order++;
            found = true;
            break;
          }
        }

        // // Removed feature until a permanent fix
        // if (!found) {
        //   $scope.currencies_all.push({
        //     'name': $scope.send.amount_feedback.currency().to_human().toUpperCase(),
        //     'value': $scope.send.amount_feedback.currency().to_human().toUpperCase(),
        //     'order': 1
        //   });
        // }
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
          $scope.mode = 'error';

          if (res.engine_result) {
            $scope.setEngineStatus(res, false);
          } else if (res.error === 'remoteError') {
            $scope.error_type = res.remote.error;
          } else {
            $scope.error_type = 'unknown';
          }
        });
      });
    };

    $scope.send_confirmed = function () {
      var send = $scope.send;
      var currency = $scope.send.currency.slice(0, 3).toUpperCase();
      var amount = send.amount_feedback;
      var address = $scope.send.recipient_address;

      $scope.mode = 'sending';

      cleanPasswordUpdater();

      amount.set_issuer(address);

      var tx = network.remote.transaction();
      // Source tag
      if ($scope.send.st) {
        tx.source_tag($scope.send.st);
      }

      // Invoice ID
      // Later in the code, this will be overwritten by the one specified
      // in quote if the latter exists
      if ($scope.send.invoice_id) {
        tx.invoiceID($scope.send.invoice_id.toUpperCase());
      }

      // Add memo to tx
      tx.addMemo('client', 'rt' + $scope.version);

      if (send.secret) {
        tx.secret(send.secret);
      } else {
        // Get secret asynchronously
        keychain.getSecret(id.account, id.username, send.unlock_password,
                           function (err, secret) {
                             if (err) {
                               console.log('client: send tab: error while ' +
                                           'unlocking wallet: ', err);
                               $scope.mode = 'error';
                               $scope.error_type = 'unlockFailed';
                               return;
                             }

                             send.secret = secret;
                             $scope.send_confirmed();
                           });
        return;
      }

      if ($scope.send.quote) {
        if ('number' === typeof $scope.send.quote.destination_tag) {
          tx.destination_tag($scope.send.quote.destination_tag);
        }

        if ('string' === typeof $scope.send.quote.invoice_id) {
          tx.tx_json.InvoiceID = $scope.send.quote.invoice_id.toUpperCase();
        }

        tx.payment(id.account,
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

        tx.payment(id.account, address, amount.to_json());
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
      tx.lastLedger(network.remote._ledger_current_index + maxLedger);

      tx.on('success', function (res) {
        $scope.onTransactionSuccess(res, tx);

        rpTracker.track('Send result', {
          'Status': 'success',
          'Currency': $scope.send.currency_code,
          'Address Type': $scope.send.federation ? 'federation' : 'ripple',
          'Destination Tag': !!$scope.send.dt,
          'Time': (+new Date() - +$scope.confirmedTime) / 1000,
          'Address': $scope.userBlob.data.account_id,
          'Transaction ID': res.tx_json.hash
        });

        if ($routeParams.return_url) {
          document.location.replace($routeParams.return_url);
        }
      });

      tx.on('proposed', function (res) {
        $scope.onTransactionProposed(res, tx);
      });

      tx.on('error', function (res) {
        $scope.onTransactionError(res, tx);

        rpTracker.track('Send result', {
          'Status': 'error',
          'Message': res.engine_result,
          'Currency': $scope.send.currency_code,
          'Address Type': $scope.send.federation ? 'federation' : 'ripple',
          'Destination Tag': !!$scope.send.dt,
          'Time': (+new Date() - +$scope.confirmedTime) / 1000,
          'Address': $scope.userBlob.account_id,
          'Transaction ID': res.tx_json.hash
        });

        if ($routeParams.abort_url) {
          document.location.replace($routeParams.abort_url);
        }
      });

      tx.submit();

      $scope.confirmedTime = new Date();
    };

    /**
     * N5. Sent page
     */
    $scope.sent = function (hash) {
      $scope.mode = 'status';
      network.remote.on('transaction', handleAccountEvent);

      function handleAccountEvent(e) {
        $scope.$apply(function () {
          if (e.transaction.hash === hash) {
            $scope.setEngineStatus(e, true);
            network.remote.removeListener('transaction', handleAccountEvent);
          }
        });
      }
    };

    $scope.setEngineStatus = function(res, accepted) {
      $scope.engine_result = res.engine_result;
      $scope.engine_result_message = res.engine_result_message;
      $scope.engine_status_accepted = !!accepted;
      $scope.mode = 'status';
      $scope.tx_result = 'partial';
      switch (res.engine_result.slice(0, 3)) {
        case 'tes':
          $scope.mode = 'status';
          $scope.tx_result = accepted ? 'cleared' : 'pending';
          break;
        case 'tep':
          $scope.mode = 'status';
          $scope.tx_result = 'partial';
          break;
        default:
          $scope.mode = 'rippleerror';
      }
    };

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        name: $scope.saveAddressName,
        view: $scope.send.recipient,
        address: $scope.send.federation ? $scope.send.recipient : $scope.send.recipient_address
      };

      if ($scope.send.dt && !$scope.send.federation) {
        contact.dt =  $scope.send.dt;
      }

      $scope.userBlob.unshift('/contacts', contact, function(err, data){
        if (err) {
          console.log('Can\'t save the contact. ', err);
          return;
        }

        $scope.contact = data;
        $scope.addressSaved = true;
      });
    };

    $scope.$on('$destroy', function () {
      // Stop pathfinding if the user leaves the tab
      if ($scope.send.pathfind) {
        $scope.send.pathfind.close();
        delete $scope.send.pathfind;
      }
      clearInterval(timer);
    });

    $scope.reset();

    if ($routeParams.to && $routeParams.amount) {
      var amountValue = $routeParams.amount;
      var amount = ripple.Amount.from_json(amountValue);
      var currency = amount.currency();
      if ($scope.currencies_all_keyed[currency.get_iso()]) {
        $scope.send.currency_choices = [currency.to_human({full_name:$scope.currencies_all_keyed[currency.get_iso()].name})];
      } else {
        $scope.send.currency_choices = [currency.to_human()];
      }
      $scope.update_destination();
    }
  }]);

};

module.exports = SendTab;
