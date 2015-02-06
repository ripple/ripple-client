var util = require('util'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    rewriter = require('../util/jsonrewriter'),
    gateways = require('../../../deps/gateways.json');

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.tabName = 'balance';
BalanceTab.prototype.mainMenu = 'wallet';

BalanceTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['marketchart']);
BalanceTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/balance.jade')();
};

BalanceTab.prototype.angular = function (module)
{
  module.controller('BalanceCtrl', ['$scope', 'rpId', 'rpNetwork', '$filter', '$http', 'rpAppManager',
                                     function ($scope, id, network, $filter, $http, appManager)
  {
    //

    // In the following, we get and watch for changes to data that is used to
    // calculate the pie chart and aggregate balance. This data includes:
    // -What balances the user holds
    // -What (if any) market value in terms of XRP each balance has, according to
    //  https://api.ripplecharts.com/api/exchangeRates
    // -What metric the user has chosen to calculate the aggregate value in

    // When the selected value metric changes, update the displayed amount.

    $scope.currenciesAll = require('../data/currencies');
    $scope.currencies = [];

    $scope.exchangeRates || ($scope.exchangeRates = {XRP: 1});

    $scope.firstCurrencySelected = 'XRP';
    $scope.secondCurrencySelected = 'USD';

    var history = [];

    $scope.selectedTrendSpan = 86400000;

    ($scope.selectedValueMetric = store.get('balance')) || ($scope.selectedValueMetric = 'XRP');

    /*** My Orders widget */
    $scope.sort_options = {
      current_pair_only: false,
      sort_field: 'type',
      reverse: false
    };

    $scope.validationPatternCurrency = /^[a-zA-Z]{3}/;

    $scope.changeMetric = function(scope) {
      $scope.selectedValueMetric = scope.selectedValueMetric;

      // NOTE: this really should be stored in the blob or
      // scoped to the blob_id so that it changes based on
      // which account is being viewed
      store.set('balance', $scope.selectedValueMetric);
    };

    $scope.$watch('selectedValueMetric', function() {
      if ($scope.selectedValueMetric && $scope.aggregateValueAsXrp) {
        updateAggregateValueDisplayed();
      }
    });

    // Maintain a dictionary for the value of each 'currency:issuer' pair, denominated in XRP.
    // Fetch the data from RippleCharts, and refresh it whenever any non-XRP balances change.
    // When exchangeRates changes, update the aggregate value, and the list of available value metrics,
    // and also check for negative balances to see if the user should be notified.

    function updateExchangeRates() {
      var currencies = [];
      var hasNegative = false;
      for (var cur in $scope.balances) {if ($scope.balances.hasOwnProperty(cur)){
        var components = $scope.balances[cur].components;
        for (var issuer in components) {if (components.hasOwnProperty(issuer)){
          // While we're at it, check for negative balances:
          hasNegative || (hasNegative = components[issuer].is_negative());
          currencies.push({
            currency: cur,
            issuer: issuer
          });
        }}
      }}
      $scope.hasNegative = hasNegative;
      var pairs = currencies.map(function(c){
        return {
          base:c,
          counter:{currency:'XRP'}
        };
      });
      if (pairs.length) {
        $scope.exchangeRatesNonempty = false;
        $http.post('https://api.ripplecharts.com/api/exchangeRates', {pairs: pairs, last: true})
        .success(function(response){
          for (var i = 0; i < response.length; i++) {
            var pair = response[i];
            if (pair.last > 0) { // Disregard unmarketable assets
              $scope.exchangeRates[pair.base.currency + ':' + pair.base.issuer] = pair.last;
            }
          }

          $scope.exchangeRatesNonempty = true;
          console.log('Exchange Rates: ', $scope.exchangeRates);
        });
      } else {
        $scope.exchangeRatesNonempty = true;
      }
    }

    $scope.$on('$balancesUpdate', updateExchangeRates);

    $scope.$watch('exchangeRates', function(){
      if ($scope.exchangeRates) {
        var isAmbiguous = {};
        var okser = Object.keys($scope.exchangeRates);
        for (var i = 0; i < okser.length; i++) {
          var cur = okser[i].split(':')[0];
          if (!isAmbiguous[cur] || !isAmbiguous.hasOwnProperty(cur)) {
            // (In case there's a currency called 'constructor' or something)
            for (var j = i + 1; j < okser.length; j++) {
              var cur2 = okser[j].split(':')[0];
              if (cur === cur2) {
                isAmbiguous[cur] = true;
                break;
              }
            }
          }
        }
        $scope.valueMetrics = okser.map(function(code){
          var curIssuer = code.split(':');
          var currencyName = $filter('rpcurrency')(ripple.Amount.from_human('0 ' + curIssuer[0])); // This is really messy
          var issuerName = curIssuer.length > 1 ? $filter('rpripplename')(curIssuer[1], false) : '';
          return {
            code: code,
            name: currencyName + (isAmbiguous[curIssuer[0]] ? '.' + issuerName : ''),
            nameShort: currencyName
          };
        });

        updateAggregateValueAsXrp();
      }
    }, true);

    // Whenever the XRP balance changes, update the aggregate value, but no need to refresh exchangeRates.
    // Update the displayed amount.

    $scope.$watch('account.Balance', updateAggregateValueAsXrp);

    function updateAggregateValueAsXrp() {
      if ($scope.account.Balance) {
        var av = $scope.account.Balance / 1000000;
        for (var cur in $scope.balances) {if ($scope.balances.hasOwnProperty(cur)){
          var components = $scope.balances[cur].components;
          for (var issuer in components) {if (components.hasOwnProperty(issuer)){
            var rate = ( $scope.exchangeRates[cur + ':' + issuer] || 0);
            var sbAsXrp = components[issuer].to_number() * rate;
            av += sbAsXrp;
          }}
        }}
        $scope.aggregateValueAsXrp = av;
        updateAggregateValueDisplayed();
      }
    }

    function updateAggregateValueDisplayed() {
      var metric;
      _.forEach($scope.valueMetrics, function (valueMetric) {
        if (valueMetric.name === $scope.selectedValueMetric) {
          $scope.selectedValueMetricCode = valueMetric.code;
          $scope.selectedValueCurrencyShort = valueMetric.nameShort;
          metric = $scope.exchangeRates[valueMetric.code];
        }
      });

      if (!metric) {
        $scope.selectedValueMetric = $scope.selectedValueMetricCode = 'XRP';
        $scope.changeMetric($scope);
        metric = $scope.exchangeRates[$scope.selectedValueMetricCode];
      }

      $scope.aggregateValueAsMetric = $scope.aggregateValueAsXrp / metric;

      if ($scope.selectedValueMetricCode === 'XRP' ||
          $scope.selectedValueMetricCode === '0158415500000000C1F76FF6ECB0BAC600000000:rDRXp3XC6ko3JKNh1pNrDARZzFKfBzaxyi' ||
          $scope.selectedValueMetricCode === '015841551A748AD2C1F76FF6ECB0CCCD00000000:rs9M85karFkCRjvc6KMWn8Coigm9cbcgcx')
      {
        $scope.aggregateValueDisplayed = (Amount.from_json({value:($scope.aggregateValueAsMetric.toFixed(4)
            .substring(0, (($scope.aggregateValueAsXrp / metric).toFixed(4)).length - 5))})).to_human();
        $scope.aggregateValueDisplayedDecimal = $scope.aggregateValueAsMetric.toFixed(4).substring((($scope.aggregateValueAsXrp / metric)
            .toFixed(4)).length - 5, (($scope.aggregateValueAsXrp / metric).toFixed(4)).length);
      }
      else {
        $scope.aggregateValueDisplayed = (Amount.from_json({value:($scope.aggregateValueAsMetric.toFixed(2)
            .substring(0, (($scope.aggregateValueAsXrp / metric).toFixed(2)).length - 3))})).to_human();
        $scope.aggregateValueDisplayedDecimal = $scope.aggregateValueAsMetric.toFixed(2).substring((($scope.aggregateValueAsXrp / metric)
            .toFixed(2)).length - 3, (($scope.aggregateValueAsXrp / metric).toFixed(2)).length);
      }
      $scope.aggregateValueDisplayedDecimalDot =
        ($scope.aggregateValueDisplayedDecimal.substring(0, 1) === '.');
      if ($scope.aggregateValueDisplayedDecimalDot) {
        $scope.aggregateValueDisplayedDecimal =
          $scope.aggregateValueDisplayedDecimal.substring(1);
      }
    }

    // if we were previously loaded, update the estimate
    if ($scope.loadState.lines) {
      updateExchangeRates();
    }

    /**
     * Currency value trends, will be needed for red/green colorization
     * of balances widget
     * TODO: Needs outsourcing to Balances widget controller
     */

    var getDateRangeHistory = function(dateMin, dateMax, callback)
    {
      if (!id.account) return;
      var completed = false;
      var history = [];

      var params = {
        account: id.account,
        ledger_index_min: -1,
        binary: true
      };

      getTx();

      function getTx() {
        network.remote.request_account_tx(params, function(err, data) {
          if (!data.transactions.length) {
            return callback(history);
          }

          for (var i = 0;i < data.transactions.length;i++) {
            var date = ripple.utils.toTimestamp(data.transactions[i].tx.date);

            if (date < dateMin.getTime()) {
              completed = true;
              break;
            }

            if (date > dateMax.getTime()) {
              continue;
            }

            // Push
            var tx = rewriter.processTxn(data.transactions[i].tx, data.transactions[i].meta, id.account);
            if (tx) {
              history.push(tx);
            }
          }

          if (data.marker) {
            params.marker = data.marker;
            $scope.tx_marker = params.marker;
          } else {
            // Received all transactions since a marker was not returned
            completed = true;
          }

          if (completed) {
            callback(history);
          } else {
            getTx();
          }
        });
      }
    };

    var changeDateRange = function(dateMin, dateMax) {
      history = [];
      $scope.trendValueAsPercentage = undefined;

      getDateRangeHistory(dateMin, dateMax, function(hist){
        $scope.$apply(function () {
          history = hist;
          updateTrend();
        });
      });
    };

    var updateTrend = function() {
      $scope.trendMap = {};
      var trendMap = _.reduce(history, function(map, event) {
          _.forEach(event.effects, function(effect){
            switch (effect.type) {
              case 'fee':
              case 'balance_change':
              case 'trust_change_balance':
                currency = effect.amount.is_native() ? 'XRP' : (effect.currency + ':' + effect.counterparty);
                if (typeof map[currency] === 'undefined') map[currency] = 0;

                map[currency] += effect.amount.is_native()
                  ? effect.amount.to_number() / 1000000
                  : effect.amount.to_number();
                break;
            }
          });
          return map;
        }, {});
      $scope.trendMap = trendMap;
    };

    $scope.changeTrendSpan = function(scope) {
      $scope.selectedTrendSpan = scope.selectedTrendSpan;
    };

    var refreshTrend = function() {
      changeDateRange(new Date(new Date() - $scope.selectedTrendSpan), new Date());
    };

    //$scope.$watch('selectedTrendSpan', refreshTrend);
    //$scope.$watch('account.Balance', refreshTrend);

    //$scope.$watch('aggregateValueAsXrp', updateTrendValue);
    //$scope.$watch('trendMap', updateTrendValue);

    function updateTrendValue() {
      if (!$scope.trendMap) return;
      var av = $scope.aggregateValueAsXrp;
      for (var cur in $scope.trendMap) {if ($scope.trendMap.hasOwnProperty(cur)){
        var rate = ($scope.exchangeRates[cur] || 0);
        var sbAsXrp = $scope.trendMap[cur] * rate;
        av -= sbAsXrp;
      }}
      $scope.trendValueAsPercentage = ($scope.aggregateValueAsXrp - av) / av;
    }

    /**
     * Market chart widget
     */
    $scope.$watch('firstCurrencySelected', function () {
      $scope.firstIssuerSelected = '';
      if ($scope.firstCurrencySelected == 'XRP') {
        $scope.disableFirstIssuer = true;
      }
      else {
        $scope.disableFirstIssuer = false;
        $scope.firstIssuer = {};
        gateways.forEach(function(gateway) {
          var accounts = gateway.accounts;
          accounts.forEach(function(account) {
            account.currencies.forEach(function(currency) {
              if (currency == $scope.firstCurrencySelected) {
                if ($scope.firstIssuerSelected === '') {
                  $scope.firstIssuerSelected = gateway.name;
                }
                $scope.firstIssuer[gateway.name] = gateway;
              }
            });
          });
        });
      }
    });

    $scope.$watch('secondCurrencySelected', function () {
      $scope.secondIssuerSelected = '';
      if ($scope.secondCurrencySelected == 'XRP') {
        $scope.disableSecondIssuer = true;
      }
      else {
        $scope.disableSecondIssuer = false;
        $scope.secondIssuer = {};
        gateways.forEach(function(gateway) {
          var accounts = gateway.accounts;
          accounts.forEach(function(account) {
            account.currencies.forEach(function(currency) {
              if (currency == $scope.secondCurrencySelected) {
                if ($scope.secondIssuerSelected === '') {
                  $scope.secondIssuerSelected = gateway.name;
                }
                $scope.secondIssuer[gateway.name] = gateway;
              }
            });
          });
        });
      }
    });

    $scope.issuerNameToAddress = function(issuerName, selectedCurrency) {
      if (selectedCurrency === 'XRP') {
        return '';
      }
      var issuerAddress = '';
      gateways.forEach(function(gateway) {
        if (issuerName !== gateway.name) {
          return;
        }
        var accounts = gateway.accounts;
        accounts.forEach(function(account){
          account.currencies.forEach(function(currency){
            if (currency === selectedCurrency) {
              issuerAddress = account.address;
            }
          });
        });
      });
      return issuerAddress;
    };

    $scope.flipCurrencies = function () {
      var oldFirstCurrencySelected  = $scope.firstCurrencySelected,
          oldFirstIssuerSelected    = $scope.firstIssuerSelected,
          oldSecondCurrencySelected = $scope.secondCurrencySelected,
          oldSecondIssuerSelected   = $scope.secondIssuerSelected;
      $scope.firstCurrencySelected  = oldSecondCurrencySelected;
      $scope.firstIssuerSelected    = oldSecondIssuerSelected;
      $scope.secondCurrencySelected = oldFirstCurrencySelected;
      $scope.secondIssuerSelected   = oldFirstIssuerSelected;
    };

    for (var i = 0; i < $scope.currenciesAll.length; i++) {
      if ($scope.currenciesAll[i].custom_trade_currency_dropdown) {
        $scope.currencies.push($scope.currenciesAll[i].value);
      }
    }

    /**
     * My Orders widget
     */
    $scope.sortOptions = {
      currentPairOnly: false,
      sortField: 'type',
      sortFieldName: 'Type',
      reverse: false
    };

    $scope.sortOptions.sortFieldName = $scope.ordersSortFieldChoicesKeyed[$scope.sortOptions.sortField];

    $scope.$watch('sortOptions.sortFieldName', function () {
      $scope.sortOptions.sortField = $scope.ordersSortFieldChoicesKeyedReverse[$scope.sortOptions.sortFieldName];
    });
    $scope.$watch('sortOptions.sortField', function () {
      $scope.sortOptions.sortFieldName = $scope.ordersSortFieldChoicesKeyed[$scope.sortOptions.sortField];
    });

    $scope.view_orders_history = function()
    {
      $location.url('/history?f=orders');
    }

  }]);
};

module.exports = BalanceTab;
