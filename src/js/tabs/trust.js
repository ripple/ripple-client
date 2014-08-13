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
    if (!id.loginStatus) return id.goId();

    // Hide advanced settings as default
    $scope.advanced_feature_switch = false;

    // Trust line sorting
    $scope.sorting = {
      predicate: 'balance',
      reverse: true,
      sort: function(line){
        return $scope.sorting.predicate === 'currency' ? line.currency : line.balance.to_number();
      }
    };

    // orderBy filter works with arrays
    var updateLines = function() {
      $scope.linesArray = _.toArray($scope.lines);
    };

    $scope.$on('$balancesUpdate', updateLines);

    $scope.validation_pattern = /^0*(([1-9][0-9]*.?[0-9]*)|(.0*[1-9][0-9]*))$/; //Don't allow zero for new trust lines.

    $scope.reset = function () {
      $scope.mode = 'main';
      var usdCurrency = Currency.from_human('USD');
      $scope.currency = usdCurrency.to_human({full_name:$scope.currencies_all_keyed[usdCurrency.get_iso()].name});
      $scope.addform_visible = false;
      $scope.editform_visible = false;
      $scope.edituser = '';
      $scope.amount = '';
      $scope.allowrippling = false;
      $scope.counterparty = '';
      $scope.saveAddressName = '';
      $scope.error_account_reserve = false;

      // If all the form fields are prefilled, go to confirmation page
      if ($routeParams.to && $routeParams.amount) {
        // At this stage 'counterparty_address' may be empty. Wait for it...
        var watcher = $scope.$watch('counterparty_address', function(address){
          if (address) {
            $scope.grant();
            watcher();
          }
        });
      }
    };

    $scope.toggle_form = function () {

      if($scope.addform_visible || $scope.editform_visible)
        $scope.reset();
      else
        $scope.addform_visible = true;
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
      $network.remote.request_account_info($scope.counterparty_address)
        // if account is valid then just to confirm page
        .on('success', function (m){
          $scope.$apply(function(){
            // hide throbber
            $scope.verifying = false;

            console.log('inside grant, $scope.currency is: ', $scope.currency);

            $scope.lineCurrencyObj = Currency.from_human($scope.currency);
            var matchedCurrency = $scope.lineCurrencyObj.has_interest() ? $scope.lineCurrencyObj.to_hex() : $scope.lineCurrencyObj.get_iso();
            var match = /^([a-zA-Z0-9]{3}|[A-Fa-f0-9]{40})\b/.exec(matchedCurrency);

            if (!match) {
              // Currency code not recognized, should have been caught by
              // form validator.
              console.error('Currency code:', match, 'is not recognized');
              return;
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
            currency = amount.currency().to_human({full_name:$scope.currencies_all_keyed[amount.currency().get_iso()].name});
            var balance = $scope.balances[currency];
            $scope.currencyWarning = false;

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
            });
          });
        })
      ;

      keychain.requestSecret(id.account, id.username, function (err, secret) {
        // XXX Error handling
        if (err) return;

        $scope.mode = 'granting';

        tx.secret(secret);
        tx.submit();
      });
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
    };

    function setEngineStatus(res, accepted) {
      $scope.engine_result = res.engine_result;
      $scope.engine_result_message = res.engine_result_message;

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

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        'name': $scope.saveAddressName,
        'address': $scope.counterparty_address
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

    $scope.load_orderbook = function() {
      $scope.orderbookStatus = false;

      if ($scope.book) {
        $scope.book.unsubscribe();
      }

      $scope.book = books.get({
        currency: $scope.currency,
        issuer: $scope.counterparty
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

    }

    $scope.edit_line = function ()
    {
      console.log('this in edit_line is: ', this.component);
      var line = this.component;
      var filterAddress = $filter('rpcontactnamefull');
      var contact = filterAddress(line.issuer);
      $scope.line = this.component;
      $scope.edituser = (contact) ? contact : 'User';
      $scope.validation_pattern = contact ? /^[0-9.]+$/ : /^0*(([1-9][0-9]*.?[0-9]*)|(.0*[1-9][0-9]*))$/;

      var lineCurrency = Currency.from_json(line.currency);
      var formatOpts;
      if ($scope.currencies_all_keyed[lineCurrency.get_iso()]) {
        formatOpts = {
          full_name:$scope.currencies_all_keyed[lineCurrency.get_iso()].name
        }
      }

      $scope.lineCurrencyObj = lineCurrency;
      $scope.currency = lineCurrency.to_human(formatOpts);
      $scope.balance = line.balance.to_human();
      $scope.balanceAmount = line.balance;
      $scope.counterparty = line.issuer;
      $scope.counterparty_view = contact;

      $scope.amount = line.max.currency().has_interest()
        ? +Math.round(line.max.applyInterest(new Date()).to_text())
        : +line.max.to_text()

      $scope.allowrippling = line.rippling;

      // Close/open form. Triggers focus on input.
      $scope.addform_visible = false;
      $scope.editform_visible = false;
      $timeout(function(){
        $scope.editform_visible = true;
      });

      $scope.load_orderbook();
    };

    $scope.delete_line = function()
    {

      var setSecretAndSubmit = function(tx) {
        keychain.requestSecret(id.account, id.username, function (err, secret) {
          if (err) {
            $scope.mode = 'error';
            console.log('Error on requestSecret: ', err);
            return;
          }

          tx.secret(secret);

          tx.submit(function(err, res) {
            if (err) {
              $scope.mode = 'error';
              console.log('Error on tx submit: ', err);
              return;
            }

            console.log('Transaction has been submitted with response:', res);
          });
        });
      }

      var nullifyTrustLine = function(idAccount, lineCurrency, lineAccount) {
        var tx = $network.remote.transaction();
        tx.trustSet(idAccount, '0' + '/' + lineCurrency + '/' + lineAccount);
        tx.setFlags('ClearNoRipple');

        setSecretAndSubmit(tx);
      }

      var clearBalance = function(selfAddress, issuerAddress, curr, amountObject, callback) {

        // Decision tree: two paths
        // 1) There is a market -> send back balance to user as XRP
        // 2) There is no market -> send back balance to issuer

        var sendBalanceToSelf = function() {
          var tx = $network.remote.transaction();
          var payment = tx.payment(selfAddress, selfAddress, '100000000000');

          payment.setFlags('PartialPayment');
          payment.sendMax(amountObject.to_human() + '/' + curr + '/' + issuerAddress);

          return tx;
        };

        var sendBalanceToIssuer = function() {
          var tx = $network.remote.transaction();

          var amount = amountObject.clone();
          var newAmount = amount.set_issuer(issuerAddress);
          var payment = tx.payment(selfAddress, issuerAddress, newAmount);

          return tx;
        }

        var tx = ($scope.orderbookStatus === 'exists') ? sendBalanceToSelf() : sendBalanceToIssuer();

        setSecretAndSubmit(tx);

        tx.once('proposed', callback);
      }

      // $scope.counterparty inside the clearBalance callback function does not have counterparty in its scope, therefore, we need an immediate function to capture it.

      if ($scope.balance !== '0') {
        (function (counterparty) {
          clearBalance(id.account, $scope.counterparty, $scope.currency, $scope.balanceAmount, function(res) {
            nullifyTrustLine(id.account, $scope.currency, counterparty);
          });
        })($scope.counterparty);
      }

      else {
        nullifyTrustLine(id.account, $scope.currency, $scope.counterparty);
      }

      $scope.toggle_form();

    };

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.counterparty_query = webutil.queryFromContacts(contacts);
    }, true);

    $scope.currency_query = webutil.queryFromOptionsIncludingKeys($scope.currencies_all);

    $scope.reset();

    updateLines();

    var updateAccountLines = function(currArr) {
      var obj = {};
      currArr = currArr || [];

      for (var i = 0; i < currArr.length; i++) {
        var currentEntry = currArr[i];
        var newEntry = {
          currency: currentEntry.currency,
          issuer: currentEntry.account,
          balance: ripple.Amount.from_json({
            currency: currentEntry.currency,
            value: currentEntry.balance,
            issuer: currentEntry.account
          }),
          max: ripple.Amount.from_json({
            currency: currentEntry.currency,
            value: currentEntry.limit,
            issuer: currentEntry.account
          }),
          min: ripple.Amount.from_json({
            currency: currentEntry.currency,
            value: currentEntry.limit_peer,
            issuer: currentEntry.account
          }),
          rippling: currentEntry.no_ripple_peer
        }

        if (obj[currentEntry.currency] === undefined) {
          obj[currentEntry.currency] = { components: [], amtObj: null };
          obj[currentEntry.currency].amtObj = ripple.Amount.from_json({
            currency: currentEntry.currency,
            value: currentEntry.balance,
            issuer: currentEntry.account
          });
        }

        obj[currentEntry.currency].components.push(newEntry);
      }

      $scope.accountLines = obj;
      console.log('$scope.accountLines is: ', $scope.accountLines);

      return;
    }

    $scope.$watch('_trustlines', function(line) {
      console.log('$scope.trustlines is: ', $scope._trustlines);
      updateAccountLines($scope._trustlines);
    }, true);
  }]);

  module.controller('AccountRowCtrl', ['$scope', 'rpNetwork', 'rpId', 'rpKeychain',
    function ($scope, $network, id, keychain) {

      $scope.validation_pattern = /^0*(([0-9]*.?[0-9]*)|(.0*[1-9][0-9]*))$/;

      $scope.cancel = function () {
        $scope.editing = false;
      }

      $scope.edit_account = function() {
        $scope.editing = true;

        console.log('$scope.component is: ', $scope.component);

        $scope.trust = {};
        $scope.trust.max = Number($scope.component.max.to_json().value);
        $scope.trust.min = Number($scope.component.min.to_json().value);
        $scope.rippling = !!$scope.component.rippling;
      }

      $scope.save_account = function () {
        var amount = ripple.Amount.from_human(
          $scope.trust.max + ' ' + $scope.component.currency,
          {reference_date: new Date(+new Date() + 5*60000)}
        );

        amount.set_issuer($scope.component.issuer);

        console.log(amount.to_human());

        if (!amount.is_valid()) {
          // Invalid amount. Indicates a bug in one of the validators.
          console.log('Invalid amount');
          return;
        }

        var tx = $network.remote.transaction();

        // Flags
        tx
          .rippleLineSet(id.account, amount)
          .setFlags($scope.component.rippling ? 'ClearNoRipple' : 'NoRipple')
          .on('success', function(res){
            console.log('success');
            $scope.$apply(function () {
              setEngineStatus(res, true);
              $scope.editing = false;
            });
          })
          .on('error', function(res){
            console.log('error', res);
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.mode = 'error';
              });
            });
          })
        ;

        function setEngineStatus(res, accepted) {
          $scope.engine_result = res.engine_result;
          $scope.engine_result_message = res.engine_result_message;

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

        keychain.requestSecret(id.account, id.username, function (err, secret) {
          // XXX Error handling
          if (err) return;

          $scope.mode = 'granting';

          tx.secret(secret);
          tx.submit();
        });
      };

    }]);

};



module.exports = TrustTab;
