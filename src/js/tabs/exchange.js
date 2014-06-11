var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base,
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
    'rpId', 'rpNetwork', 'rpTracker', 'rpKeychain', '$rootScope',
    function ($scope, $timeout, $routeParams, $id, $network, $rpTracker, keychain, $rootScope)
    {
      if (!$id.loginStatus) return $id.goId();

      var timer;

      // Remember user preference on Convert vs. Trade
      $rootScope.ripple_exchange_selection_trade = false;

      var xrpCurrency = Currency.from_json("XRP");

      $scope.xrp = {
        name: xrpCurrency.to_human({full_name: _.where($scope.currencies_all, {value: "XRP"})[0].name } ),
        code: xrpCurrency.get_iso(),
        currency: xrpCurrency
      };

      $scope.$watch('exchange.amount', function () {
        $scope.update_exchange();
      }, true);

      $scope.$watch('exchange.currency_name', function () {
        var exchange = $scope.exchange;
        var currency = Currency.from_human($scope.exchange.currency_name ? $scope.exchange.currency_name : "XRP");
        exchange.currency_obj = currency;
        exchange.currency_code = currency.get_iso();
        exchange.currency_name = currency.to_human({full_name: _.where($scope.currencies_all, {value: currency.get_iso()})[0].name});
        $scope.update_exchange();
      }, true);


      $scope.reset_paths = function () {
        var exchange = $scope.exchange;

        exchange.alternatives = [];
      };

      var pathUpdateTimeout;
      $scope.update_exchange = function () {
        var exchange = $scope.exchange;
        var formatted = "" + exchange.amount + " " + exchange.currency_code;

        $scope.reset_paths();

        // if formatted or money to exchange is 0 then don't calculate paths or offer to exchange
        if (parseFloat(formatted) === 0)
        {
          $scope.error_type = 'required';
          return false;
        }

        exchange.amount_feedback = Amount.from_human(formatted);
        exchange.amount_feedback.set_issuer($id.account);

        if (exchange.amount_feedback.is_valid()) {
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
          var pf = $network.remote.path_find($id.account,
              $id.account,
              amount);

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

              if (!upd.alternatives || !upd.alternatives.length) {
                $scope.exchange.path_status  = "no-path";
                $scope.exchange.alternatives = [];
              } else {
                $scope.exchange.path_status  = "done";
                $scope.exchange.alternatives = _.map(upd.alternatives, function (raw) {
                  var alt = {};
                  alt.amount   = Amount.from_json(raw.source_amount);
                  alt.rate     = alt.amount.ratio_human(amount);
                  alt.send_max = alt.amount.product_human(Amount.from_json('1.01'));
                  alt.paths    = raw.paths_computed
                      ? raw.paths_computed
                      : raw.paths_canonical;

                  return alt;
                });
              }
            });
          });
        });
      };

      $scope.$watch('lines', function (lines) {

        // create a list of currency codes from the trust line objects
        var currencies = _.uniq(_.map(lines, function (line) {
          return line.currency;
        }));

        // add XRP
        currencies.unshift('XRP');

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

        $scope.currency_choices = currencies;

      }, true);

      $scope.reset = function () {
        $scope.mode = "form";

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
        $scope.mode = "form";
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

        $scope.mode = "confirm";
      };

      /**
       * N4. Waiting for transaction result page
       */
      $scope.exchange_confirmed = function () {
        var amount = Amount.from_human(""+$scope.exchange.amount+" "+$scope.exchange.currency_name);

        amount.set_issuer($id.account);

        var tx = $network.remote.transaction();

        // Destination tag
        tx.destination_tag(webutil.getDestTagFromAddress($id.account));
        tx.payment($id.account, $id.account, amount.to_json());
        tx.send_max($scope.exchange.alt.send_max);
        tx.paths($scope.exchange.alt.paths);

        if ($scope.exchange.secret) {
          tx.secret($scope.exchange.secret);
        } else {
          // Get secret asynchronously
          keychain.requestSecret($id.account, $id.username,
            function (err, secret) {
              if (err) {
                console.log("client: exchange tab: error while " +
                  "unlocking wallet: ", err);
                $scope.mode = "error";
                $scope.error_type = "unlockFailed";
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
              if ($scope.currencies_all[i].value.toLowerCase() === $scope.exchange.amount_feedback.currency().to_human().toLowerCase()) {
                $scope.currencies_all[i].order++;
                found = true;
                break;
              }
            }

            if (!found) {
              $scope.currencies_all.push({
                "name": $scope.exchange.amount_feedback.currency().to_human().toUpperCase(),
                "value": $scope.exchange.amount_feedback.currency().to_human().toUpperCase(),
                "order": 1
              });
            }
          });
        });
        tx.on('success',function(res){
          setEngineStatus(res, true);
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
       * N6. exchanged page
       */
      $scope.exchanged = function (hash) {
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
          case 'tel':
            $scope.tx_result = "local";
            break;
          default:
            console.warn("Unhandled engine status encountered!");
        }
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

module.exports = ExchangeTab;
