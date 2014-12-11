var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;
var Amount = ripple.Amount;
var Currency = ripple.Currency;

var TrustTab = function ()
{
  Tab.call(this);

};

util.inherits(TrustTab, Tab);

TrustTab.prototype.tabName = 'trust';
TrustTab.prototype.mainMenu = 'fund';

TrustTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/trust.jade')();
};

TrustTab.prototype.angular = function (module)
{
  module.controller('TrustCtrl', ['$scope', 'rpBooks', '$timeout', '$routeParams', 'rpId',
                                  '$filter', 'rpNetwork', 'rpTracker', 'rpKeychain',
                                  function ($scope, books, $timeout, $routeParams, id,
                                            $filter, $network, $rpTracker, keychain)
  {
    $scope.advanced_feature_switch = Options.advanced_feature_switch;
    $scope.trust = {};

    // Trust line sorting
    $scope.sorting = {
      predicate: 'balance',
      reverse: true,
      sort: function(line){
        return $scope.sorting.predicate === 'currency' ? line.currency : line.balance.to_number();
      }
    };

    $scope.validation_pattern = /^0*(([1-9][0-9]*.?[0-9]*)|(.0*[1-9][0-9]*))$/; //Don't allow zero for new trust lines.

    $scope.reset = function () {
      $scope.mode = 'main';
      var usdCurrency = Currency.from_human('USD');
      $scope.currency = usdCurrency.to_human({full_name:$scope.currencies_all_keyed[usdCurrency.get_iso()].name});
      $scope.addform_visible = false;
      $scope.edituser = '';
      $scope.amount = Options.gateway_max_limit;
      $scope.allowrippling = false;
      $scope.counterparty = '';
      $scope.counterparty_view = '';
      $scope.counterparty_address = '';
      $scope.saveAddressName = '';
      $scope.error_account_reserve = false;
    };

    $scope.toggle_form = function () {

      if($scope.addform_visible) {
        $scope.reset();
      } else {
        $scope.addform_visible = true;
      }
    };


    // User should not even be able to try granting a trust if the reserve is insufficient
    $scope.$watch('account', function() {
      $scope.can_add_trust = false;
      if ($scope.account.Balance && $scope.account.reserve_to_add_trust) {
        if (!$scope.account.reserve_to_add_trust.subtract($scope.account.Balance).is_positive()
          || $.isEmptyObject($scope.lines))
        {
          $scope.can_add_trust = true;
        }
      }
    }, true);

    $scope.$watch('counterparty', function() {
      $scope.error_account_reserve = false;
      $scope.contact = webutil.getContact($scope.userBlob.data.contacts,$scope.counterparty);
      if ($scope.contact) {
        $scope.counterparty_name = $scope.contact.name;
        $scope.counterparty_address = $scope.contact.address;
      } else {
        $scope.counterparty_name = '';
        $scope.counterparty_address = $scope.counterparty;
      }
    }, true);

    /**

     * N2. Confirmation page
     */
    $scope.grant = function ()
    {
      // set variable to show throbber
      $scope.verifying = true;
      $scope.error_account_reserve = false;
      // test if account is valid
      $network.remote.requestAccountInfo({account: $scope.counterparty_address})
        // if account is valid then just to confirm page
        .on('success', function (m){
          $scope.$apply(function(){
            // hide throbber
            $scope.verifying = false;

            $scope.lineCurrencyObj = Currency.from_human($scope.currency);
            var matchedCurrency = $scope.lineCurrencyObj.has_interest() ? $scope.lineCurrencyObj.to_hex() : $scope.lineCurrencyObj.get_iso();
            var match = /^([a-zA-Z0-9]{3}|[A-Fa-f0-9]{40})\b/.exec(matchedCurrency);

            if (!match) {
              // Currency code not recognized, should have been caught by
              // form validator.
              console.error('Currency code:', match, 'is not recognized');
              return;
            }

            if ($scope.advanced_feature_switch === false || $scope.amount === "") {
              // $scope.amount = Number(ripple.Amount.consts.max_value);
              $scope.amount = Options.gateway_max_limit;
            }

            var amount = ripple.Amount.from_human('' + $scope.amount + ' ' + $scope.lineCurrencyObj.to_hex(), {reference_date: new Date(+new Date() + 5*60000)});

            amount.set_issuer($scope.counterparty_address);
            if (!amount.is_valid()) {
              // Invalid amount. Indicates a bug in one of the validators.
              return;
            }

            $scope.amount_feedback = amount;

            $scope.confirm_wait = true;
            $timeout(function () {
              $scope.confirm_wait = false;
            }, 1000, true);

            $scope.mode = 'confirm';

            /**
             * Warning messages
             *
             * - firstIssuer
             * - sameIssuer
             * - multipleIssuers
             */
            // var currency = amount.currency().to_human({full_name:$scope.currencies_all_keyed[amount.currency().get_iso()].name});
            // var balance = $scope.balances[currency];
            // $scope.currencyWarning = false;

            // New trust on a currency or no rippling enabled
            // if (!balance || !$scope.allowrippling) {
            //   $scope.currencyWarning = 'firstIssuer';
            // }
            // else {
              // Trust limit change
              // for (var counterparty in balance.components) {
              //   if (counterparty === $scope.counterparty_address)
              //     $scope.currencyWarning = 'sameIssuer';
              // }

              // Multiple trusts on a same currency
              // if (!$scope.currencyWarning)
              //   $scope.currencyWarning = 'multipleIssuers';
            // }
          });
        })
        .on('error', function (m){
          setImmediate(function () {
            $scope.$apply(function(){
              $scope.verifying = false;
              $scope.error_account_reserve = true;
              console.log('There was an error', m);
            });
          });
        })
        .request();
    };

    /**
     * N3. Waiting for grant result page
     */
    $scope.grant_confirmed = function () {
      var amount = $scope.amount_feedback.to_json();
      var tx = $network.remote.transaction();

      // Add memo to tx
      tx.addMemo('client', 'rt' + $scope.version);


      // Flags
      tx
        .rippleLineSet(id.account, amount)
        .setFlags($scope.allowrippling ? 'ClearNoRipple' : 'NoRipple')
        .on('proposed', function(res){
          $scope.$apply(function () {
            setEngineStatus(res, false);
            $scope.granted(tx.hash);

            // Remember currency and increase order
            var found;

            for (var i = 0; i < $scope.currencies_all.length; i++) {
              if ($scope.currencies_all[i].value.toLowerCase() === $scope.amount_feedback.currency().get_iso().toLowerCase()) {
                $scope.currencies_all[i].order++;
                found = true;
                break;
              }
            }

            // // Removed feature until a permanent fix
            // if (!found) {
            //   $scope.currencies_all.push({
            //     'name': currency,
            //     'value': currency,
            //     'order': 1
            //   });
            // }
          });
        })
        .on('success', function(res){
          $scope.$apply(function () {
            setEngineStatus(res, true);
          });
        })
        .on('error', function(res){
          setImmediate(function () {
            $scope.$apply(function () {
              $scope.mode = 'error';

              setEngineStatus(res, false);

              $scope.reset();

            });
          });
        })
      ;

      keychain.requestSecret(id.account, id.username, function (err, secret) {
        // XXX Error handling
        if (err) {
          $scope.load_notification('unlock_failed');

          $scope.reset();
          return;
        }

        $scope.mode = 'granting';

        tx.secret(secret);
        tx.submit();

      });

      $scope.toggle_form();
    };

    /**
     * N5. Granted page
     */
    $scope.granted = function (hash) {
      $scope.mode = 'granted';
      $network.remote.on('transaction', handleAccountEvent);

      function handleAccountEvent(e) {
        $scope.$apply(function () {
          if (e.transaction.hash === hash) {
            setEngineStatus(e, true);
            $network.remote.removeListener('transaction', handleAccountEvent);
          }
        });
      }

      $timeout(function(){
        $scope.mode = 'main';
      }, 10000);
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
        case 'tec':
          $scope.tx_result = 'failed';
          break;
        case 'tel':
          $scope.tx_result = "local";
          break;
        case 'tep':
          console.warn('Unhandled engine status encountered!');
      }
    }

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.counterparty_query = webutil.queryFromContacts(contacts);
    }, true);

    // Get all currencies from currencies.js, parse through to display only those with display: true
    var displayCurrenciesOnly = [];

    for (var i = 0; i < $scope.currencies_all.length; i++) {
      if ($scope.currencies_all[i].display) {
        displayCurrenciesOnly.push($scope.currencies_all[i]);
      }
    }

    $scope.currency_query = webutil.queryFromOptionsIncludingKeys(displayCurrenciesOnly);

    $scope.reset();

    var updateAccountLines = function() {
      var obj = {};

      _.each($scope.lines, function(line){
        if (!obj[line.currency]) {
          obj[line.currency] = { components: [] };
        }

        obj[line.currency].components.push(line);

      });

      $scope.accountLines = obj;
      return;
    };

    $scope.$on('$balancesUpdate', function(){
      updateAccountLines();
    });

    updateAccountLines();
  }]);

  module.controller('AccountRowCtrl', ['$scope', 'rpBooks', 'rpNetwork', 'rpId', 'rpKeychain', '$timeout',
    function ($scope, books, $network, id, keychain, $timeout) {

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
          case 'tec':
            $scope.tx_result = 'failed';
            break;
          case 'tel':
            $scope.tx_result = "local";
            break;
          case 'tep':
            console.warn('Unhandled engine status encountered!');
        }
      }
        
      $scope.cancel = function () {
        $scope.editing = false;
      };


      $scope.edit_account = function() {
        $scope.editing = true;

        $scope.trust = {};
        $scope.trust.limit = Number($scope.component.limit.to_json().value);
        $scope.trust.rippling = !$scope.component.no_ripple;
        $scope.trust.limit_peer = Number($scope.component.limit_peer.to_json().value);
        $scope.trust.balance = String($scope.component.balance.to_json().value);
        $scope.trust.balanceAmount = $scope.component.balance;

        var currency = Currency.from_human($scope.component.currency);

        currency.to_human({full_name:$scope.currencies_all_keyed[currency.get_iso()]})
          ? $scope.trust.currency = currency.to_human({full_name:$scope.currencies_all_keyed[currency]})
          : $scope.trust.currency = currency.to_human({full_name:$scope.currencies_all_keyed[currency.get_iso()].name});

        // $scope.trust.currency = currency.to_human({full_name:$scope.currencies_all_keyed[currency.get_iso()].name});
        $scope.trust.counterparty = $scope.component.account;

        $scope.load_orderbook();
      };

      $scope.delete_account = function()
      {
        $scope.trust.loading = true;
        $scope.load_notification('remove_gateway');

        var setSecretAndSubmit = function(tx) {

          tx
            .on('proposed', function(res){
              $scope.$apply(function () {
                setEngineStatus(res, false);              
              });
            })
            .on('success', function(res){
              $scope.$apply(function () {
                setEngineStatus(res, true);

                $scope.trust.loading = false;
                $scope.editing = false;
              });
            })
            .on('error', function(res){
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {

                  if (res.result === 'tejMaxFeeExceeded') {
                    $scope.load_notification('max_fee');
                  }

                  $scope.mode = 'error';
                  setEngineStatus(res, false);

                  $scope.trust.loading = false;
                });
              });
            });


          keychain.requestSecret(id.account, id.username, function (err, secret) {
            if (err) {
              $scope.mode = 'error';
              $scope.trust.loading = false;
              $scope.load_notification('unlock_failed');
              console.log('Error on requestSecret: ', err);

              $scope.reset();
              
              return;
            }

            tx.secret(secret);
            tx.submit();
          });
        };

        var nullifyTrustLine = function(idAccount, lineCurrency, lineAccount) {
          var tx = $network.remote.transaction();

          // Add memo to tx
          tx.addMemo('client', 'rt' + $scope.version);

          tx.trustSet(idAccount, '0' + '/' + lineCurrency + '/' + lineAccount);
          tx.setFlags('ClearNoRipple');

          setSecretAndSubmit(tx);
        };

        var clearBalance = function(selfAddress, issuerAddress, curr, amountObject, callback) {

          // Decision tree: two paths
          // 1) There is a market -> send back balance to user as XRP
          // 2) There is no market -> send back balance to issuer

          var sendBalanceToSelf = function() {
            var tx = $network.remote.transaction();

            // Add memo to tx
            tx.addMemo('client', 'rt' + $scope.version);

            var payment = tx.payment(selfAddress, selfAddress, '100000000000');

            payment.setFlags('PartialPayment');
            payment.sendMax(amountObject.to_human() + '/' + curr + '/' + issuerAddress);

            return tx;
          };

          var sendBalanceToIssuer = function() {
            var tx = $network.remote.transaction();

            // Add memo to tx
            tx.addMemo('client', 'rt' + $scope.version);

            var amount = amountObject.clone();
            var newAmount = amount.set_issuer(issuerAddress);
            var payment = tx.payment(selfAddress, issuerAddress, newAmount);

            return tx;
          };

          var tx = ($scope.orderbookStatus === 'exists') ? sendBalanceToSelf() : sendBalanceToIssuer();

          setSecretAndSubmit(tx);

          tx.once('proposed', callback);
        };

        // $scope.counterparty inside the clearBalance callback function does not have counterparty in its scope, therefore, we need an immediate function to capture it.

        if ($scope.trust.balance !== '0') {
          (function (counterparty) {
            clearBalance(id.account, $scope.trust.counterparty, $scope.trust.currency, $scope.trust.balanceAmount, function(res) {
              nullifyTrustLine(id.account, $scope.trust.currency, counterparty);
            });
          })($scope.trust.counterparty);

        }

        else {
          nullifyTrustLine(id.account, $scope.trust.currency, $scope.trust.counterparty);

        }

      };

      $scope.load_orderbook = function() {
        $scope.orderbookStatus = false;

        if ($scope.book) {
          $scope.book.unsubscribe();
        }

        $scope.book = books.get({
          currency: $scope.trust.currency,
          issuer: $scope.trust.counterparty
        }, {

          currency: 'XRP',
          issuer: undefined
        });

        $scope.$watchCollection('book', function () {
          if (!$scope.book.updated) return;

          if ($scope.book.asks.length !== 0 && $scope.book.bids.length !== 0) {
            $scope.orderbookStatus = 'exists';
          } else {
            $scope.orderbookStatus = 'not';
          }
        });

      };

      $scope.save_account = function () {

        $scope.trust.loading = true;

        var amount = ripple.Amount.from_human(
          $scope.trust.limit + ' ' + $scope.component.currency,
          {reference_date: new Date(+new Date() + 5*60000)}
        );

        amount.set_issuer($scope.component.account);

        if (!amount.is_valid()) {
          // Invalid amount. Indicates a bug in one of the validators.
          console.log('Invalid amount');
          return;
        }

        var tx = $network.remote.transaction();

        // Add memo to tx
        tx.addMemo('client', 'rt' + $scope.version);

        // Flags
        tx
          .rippleLineSet(id.account, amount)
          .setFlags($scope.trust.rippling ? 'ClearNoRipple' : 'NoRipple')
          .on('proposed', function(res){
            $scope.$apply(function () {
              setEngineStatus(res, false);              
            });
          })
          .on('success', function(res){
            $scope.$apply(function () {
              setEngineStatus(res, true);

              $scope.trust.loading = false;
              $scope.editing = false;
            });
          })
          .on('error', function(res){
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.mode = 'error';
                setEngineStatus(res, false);

                $scope.trust.loading = false;
                $scope.editing = false;
              });
            });
          });


        keychain.requestSecret(id.account, id.username, function (err, secret) {
          // XXX Error handling
          if (err) {
            $scope.trust.loading = false;
            $scope.load_notification('error');

            $scope.reset();

            return;
          }

          $scope.mode = 'granting';

          tx.secret(secret);
          tx.submit();
        });
      };

      $scope.isIncoming = function () {
        return $scope.component.limit_peer._value.t !== 0;
      };

    }]);

};



module.exports = TrustTab;
