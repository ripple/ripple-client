var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base,
    rewriter = require('../util/jsonrewriter'),
    Currency = ripple.Currency;

var ExchangeTab = function ()
{
  Tab.call(this);
};

util.inherits(ExchangeTab, Tab);

ExchangeTab.prototype.tabName = 'exchange';
ExchangeTab.prototype.mainMenu = 'exchange';

ExchangeTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/exchange.jade')();
};

ExchangeTab.prototype.angular = function (module)
{
  module.controller('ExchangeCtrl', ['$scope', '$timeout', '$routeParams',
    'rpId', 'rpNetwork', 'rpTracker', 'rpKeychain', '$rootScope', '$location',
    function ($scope, $timeout, $routeParams, id, network, rpTracker, keychain, $rootScope, $location)
    {
      var pathUpdateTimeout;

      var timer, pf;

      // Remember user preference on Convert vs. Trade
      $rootScope.ripple_exchange_selection_trade = false;

      var xrpCurrency = Currency.from_json('XRP');

      $scope.xrp = {
        name: xrpCurrency.to_human({full_name:$scope.currencies_all_keyed.XRP.name}),
        code: xrpCurrency.get_iso(),
        currency: xrpCurrency
      };

      $scope.$watch('exchange.amount', function () {
        $scope.update_exchange();
      }, true);

      $scope.$watch('exchange.currency_name', function () {
        var exchange = $scope.exchange;
        var currency = Currency.from_human($scope.exchange.currency_name ? $scope.exchange.currency_name : 'XRP');
        exchange.currency_obj = currency;
        exchange.currency_code = currency.get_iso();
        exchange.currency_name = currency.to_human({
          full_name: $scope.currencies_all_keyed[currency.get_iso()] ? $scope.currencies_all_keyed[currency.get_iso()].name : null
        });
        $scope.update_exchange();
      }, true);

      $scope.gotoFund = function() {
        $location.path('/xrp');
      };

      $scope.reset_paths = function () {
        var exchange = $scope.exchange;

        exchange.alternatives = [];
      };

      $scope.update_exchange = function () {
        var exchange = $scope.exchange;
        var currency = ripple.Currency.from_human(exchange.currency_name);

        $scope.reset_paths();

        // if formatted or money to exchange is 0 then don't calculate paths or offer to exchange
        if (parseFloat(exchange.amount) === 0 || !exchange.currency_name)
        {
          $scope.error_type = 'required';
          return false;
        }

        else {
          $scope.error_type = '';
        }

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

        exchange.amount_feedback = Amount.from_human('' + exchange.amount + ' ' + matchedCurrency, { reference_date: refDate });
        exchange.amount_feedback.set_issuer(id.account);

        if (exchange.amount_feedback.is_valid() && exchange.amount_feedback.is_positive()) {
          exchange.path_status = 'pending';
          exchange.alt = null;

          if (pathUpdateTimeout) clearTimeout(pathUpdateTimeout);
          pathUpdateTimeout = $timeout($scope.update_paths, 500);
        } else {
          exchange.path_status = 'waiting';
        }
      };

      $scope.update_paths = function () {
        $scope.$apply(function () {
          $scope.exchange.path_status = 'pending';
          var amount = $scope.exchange.amount_feedback;

          if (amount.is_zero()) return;

          // Start path find
          pf = network.remote.path_find(id.account,
              id.account,
              amount);
              // $scope.generate_src_currencies());
              // XXX: Roll back pathfinding changes temporarily
          var isIssuer = $scope.generate_issuer_currencies();

          var lastUpdate;

          pf.on('update', function (upd) {
            $scope.$apply(function () {
              lastUpdate = new Date();

              clearInterval(timer);
              timer = setInterval(function(){
                $scope.$apply(function(){
                  var seconds = Math.round((new Date() - lastUpdate) / 1000);
                  $scope.lastUpdate = seconds || 0;
                });
              }, 1000);

              if (!upd.alternatives || !upd.alternatives.length) {
                $scope.exchange.path_status  = 'no-path';
                $scope.exchange.alternatives = [];
              } else {
                var currencies = {};
                $scope.exchange.path_status  = 'done';
                $scope.exchange.alternatives = _.filter(_.map(upd.alternatives, function (raw) {
                  var alt = {};
                  alt.amount   = Amount.from_json(raw.source_amount);
                  alt.rate     = alt.amount.ratio_human(amount);
                  alt.send_max = alt.amount.product_human(Amount.from_json('1.01'));
                  alt.paths    = raw.paths_computed
                      ? raw.paths_computed
                      : raw.paths_canonical;

                  if (alt.amount.issuer().to_json() != $scope.address && !isIssuer[alt.amount.currency().to_hex()]) {
                    currencies[alt.amount.currency().to_hex()] = true;
                  }

                  return alt;
                }), function(alt) {
                  // XXX: Roll back pathfinding changes temporarily
                  /* if (currencies[alt.amount.currency().to_hex()]) {
                    return alt.amount.issuer().to_json() != $scope.address;
                  } */
                  // return false;
                  return !(alt.amount.is_native() && $scope.account.max_spend
                    && $scope.account.max_spend.to_number() > 1
                    && $scope.account.max_spend.compareTo(alt.amount) < 0);
                });
                if (!$scope.exchange.alternatives.length) {
                  $scope.exchange.path_status  = 'no-path';
                  $scope.exchange.alternatives = [];
                }
              }
            });
          });
        });
      };

      var updateCurrencyOptions = function(){
        // create a list of currency codes from the trust line objects
        var currencies = _.uniq(_.map($scope.lines, function (line) {
          return line.currency;
        }));

        // add XRP
        currencies.unshift('XRP');

        // create a currency object for each of the currency codes
        for (var i = 0; i < currencies.length; i++) {
          currencies[i] = ripple.Currency.from_json(currencies[i]);
        }

        // create the display version of the currencies
        currencies = _.map(currencies, function (currency) {
          if ($scope.currencies_all_keyed[currency.get_iso()]) {
            return currency.to_human({full_name:$scope.currencies_all_keyed[currency.get_iso()].name});
          }

          return currency.get_iso();
        });

        $scope.currency_choices = currencies;
      };

      $scope.$on('$balancesUpdate', updateCurrencyOptions);

      $scope.reset = function () {
        $scope.mode = 'form';

        // XXX Most of these variables should be properties of $scope.exchange.
        //     The Angular devs recommend that models be objects due to the way
        //     scope inheritance works.
        $scope.exchange = {
          amount: '',
          currency_name: $scope.xrp.name,
          currency_code: $scope.xrp.code,
          currency_obj: $scope.xrp.currency,
          path_status: 'waiting',
          fund_status: 'none'
        };
        $scope.nickname = '';
        $scope.error_type = '';
        if ($scope.exchangeForm) $scope.exchangeForm.$setPristine(true);
      };

      $scope.cancelConfirm = function () {
        $scope.mode = 'form';
        $scope.exchange.alt = null;
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
      $scope.exchange_prepared = function () {
        $scope.confirm_wait = true;
        $timeout(function () {
          $scope.confirm_wait = false;
        }, 1000, true);

        $scope.mode = 'confirm';
      };

      /**
       * N4. Waiting for transaction result page
       */
      $scope.exchange_confirmed = function () {

        // parse the currency name and extract the iso
        var currency = Currency.from_human($scope.exchange.currency_name);
        currency = currency.has_interest() ? currency.to_hex() : currency.get_iso();
        var amount = Amount.from_human('' + $scope.exchange.amount + ' ' + currency);

        amount.set_issuer(id.account);

        var tx = network.remote.transaction();

        // Add memo to tx
        tx.addMemo('client', 'rt' + $rootScope.version);

        // Destination tag
        tx.destination_tag(webutil.getDestTagFromAddress(id.account));
        tx.payment(id.account, id.account, amount.to_json());
        tx.send_max($scope.exchange.alt.send_max);
        tx.paths($scope.exchange.alt.paths);

        if ($scope.exchange.secret) {
          tx.secret($scope.exchange.secret);
        } else {
          // Get secret asynchronously
          keychain.requestSecret(id.account, id.username,
            function (err, secret) {
              if (err) {
                console.log('client: exchange tab: error while ' +
                  'unlocking wallet: ', err);
                $scope.mode = 'error';
                $scope.error_type = 'unlockFailed';

                return;
              }

              $scope.exchange.secret = secret;
              $scope.exchange_confirmed();
            });
          return;
        }

        tx.on('proposed', function (res) {
          $scope.$apply(function () {
            setEngineStatus(res, false);
            $scope.exchanged(tx.hash);

            // Remember currency and increase order
            var found;

            for (var i = 0; i < $scope.currencies_all.length; i++) {
              if ($scope.currencies_all[i].value.toLowerCase() === $scope.exchange.amount_feedback.currency().get_iso().toLowerCase()) {
                $scope.currencies_all[i].order++;
                found = true;
                break;
              }
            }

            // // Removed feature until a permanent fix
            // if (!found) {
            //   $scope.currencies_all.push({
            //     name' $scope.exchange.amount_feedback.currency().to_human().toUpperCase(),
            //     value: $scope.exchange.amount_feedback.currency().to_human().toUpperCase(),
            //     order: 1
            //   });
            // }
          });
        });
        tx.on('success', function(res) {
          setEngineStatus(res, true);
          try {
            var tx = rewriter.processTxn(res.tx_json, res.metadata, id.account);
            var ccPairs = _.map(tx.affectedCurrencies, function(currencyCode) {
              if (currencyCode != 'XRP') {
                var balanceChangeEffect = _.filter(tx.effects, function(effect) {
                  return effect.type = 'trust_change_balance' && effect.currency == currencyCode;
                })[0];
                var res =  currencyCode + '.' + id.resolveNameSync(balanceChangeEffect.amount.issuer().to_json(), { tilde: true });
                return res;
              }
              return currencyCode;
            });
            var ccyPair = ccPairs.join('/');
            var eventProp = {
              Status: 'success',
              'Currency pair': ccyPair,
              Address: $scope.userBlob.data.account_id,
              'Transaction ID': res.tx_json.hash,
              Amount: amount.to_number(false)
            };
            rpTracker.track('Convert order result', eventProp);
          } catch (err) {
            console.warn(err);
          }
        });
        tx.on('error', function(res) {
          setImmediate(function () {
            $scope.$apply(function () {
              $scope.mode = 'rippleerror';
              setEngineStatus(res, false);

              if (res.error === 'remoteError' &&
                  res.remote.error === 'noPath') {
                $scope.mode = 'status';
                $scope.tx_result = 'noPath';
              }
            });
          });
          try {
            var curAltCode = $scope.exchange.alt.amount.currency().get_iso();
            var ccyPair = $scope.exchange.currency_code + '/' + curAltCode;
            var eventProp = {
              Status: 'error',
              Message: res.engine_result,
              'Currency pair': ccyPair,
              Address: $scope.userBlob.data.account_id
            };
            rpTracker.track('Convert order result', eventProp);
          } catch (err) {
            console.warn(err);
          }
        });
        tx.submit();

        $scope.mode = 'sending';
      };

      /**
       * N6. exchanged page
       */
      $scope.exchanged = function (hash) {
        $scope.mode = 'status';
        network.remote.on('transaction', handleAccountEvent);

        function handleAccountEvent(e) {
          $scope.$apply(function () {
            if (e.transaction.hash === hash) {
              setEngineStatus(e, true);
              network.remote.removeListener('transaction', handleAccountEvent);
            }
          });
        }
      };

      function setEngineStatus(res, accepted) {
        $scope.engine_result = res.engine_result;
        $scope.engine_result_message = res.engine_result_message;
        $scope.engine_status_accepted = accepted;

        switch (res.engine_result.slice(0, 3)) {
          case 'tes':
            $scope.tx_result = accepted ? 'cleared' : 'pending';
            break;
          case 'tem':
            $scope.tx_result = 'malformed';
            break;
          case 'ter':
            $scope.tx_result = 'failed';
            break;
          case 'tep':
            $scope.tx_result = 'partial';
            break;
          case 'tec':
            $scope.tx_result = 'claim';
            break;
          case 'tef':
            $scope.tx_result = 'failure';
            break;
          case 'tel':
            $scope.tx_result = 'local';
            break;
          default:
            $scope.tx_result = 'unknown';
            console.warn('Unhandled engine status encountered!');
        }
      }

      $scope.reset();

      updateCurrencyOptions();

      // Stop the pathfinding when leaving the page
      $scope.$on('$destroy', function(){
        if (pf && 'function' === typeof pf.close) {
          pf.close();
        }
        clearInterval(timer);
      });
    }]);
};

module.exports = ExchangeTab;
