var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var HistoryTab = function ()
{
  Tab.call(this);
};

util.inherits(HistoryTab, Tab);

HistoryTab.prototype.tabName = 'history';
HistoryTab.prototype.mainMenu = 'wallet';

HistoryTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/history.jade')();
};

HistoryTab.prototype.angular = function (module) {
  module.controller('HistoryCtrl', ['$scope', 'rpId', 'rpNetwork', 'rpTracker', 'rpAppManager',
                                     function ($scope, $id, $network, $rpTracker, appManager)
  {
    if (!$id.loginStatus) return $id.goId();

    var history = [];

    // Latest transaction
    var latest;

    // History collection
    $scope.historyShow = [];

    // History states
    $scope.$watch('loadState.transactions',function(){
      $scope.historyState = !$scope.loadState.transactions ? 'loading' : 'ready';
    });

    // Open/close states of individual history items
    $scope.details = [];

    //$scope.typeUsage = [];
    //$scope.currencyUsage = [];

    // Currencies from history
    var historyCurrencies = [];

    $scope.types = {
      sent: {
        'types': ['sent'],
        'checked': true
      },
      received: {
        'types': ['received'],
        'checked': true
      },
      trusts: {
        'types': ['trusting','trusted'],
        'checked': true
      },
      trades: {
        'types': ['offernew','exchange'],
        'checked': true
      },
      orders: {
        'types': ['offernew','offercancel','exchange'],
        'checked': true
      },
      other: {
        'types': ['accountset','failed','rippling'],
        'checked': true
      }
    };

    $scope.orderedTypes = ['sent','received','trusts','trades','orders','other'];

    if (store.get('ripple_history_type_selections')) {
      $scope.types = $.extend(true,$scope.types,store.get('ripple_history_type_selections'));
    }

    // Filters
    if (store.get('ripple_history_filters')) {
      $scope.filters = store.get('ripple_history_filters');
    } else {
      $scope.filters = {
        'currencies_is_active': false, // we do the currency filter only if this is true, which happens when at least one currency is off
        'currencies': {},
        'types': ['sent','received','exchange','trusting','trusted','offernew','offercancel','rippling'],
        'minimumAmount': 0.000001
      };
    }

    var getDateRangeHistory = function(dateMin,dateMax,callback)
    {
      var completed = false;
      var history = [];

      var params = {
        'account': $id.account,
        'ledger_index_min': -1,
        'limit': 200
      };

      var getTx = function(){
        $network.remote.request_account_tx(params)
        .on('success', function(data) {
          if (data.transactions.length) {
            for(var i=0;i<data.transactions.length;i++) {
              var date = ripple.utils.toTimestamp(data.transactions[i].tx.date);

              if(date < dateMin.getTime()) {
                completed = true;
                break;
              }

              if(date > dateMax.getTime())
                continue;

              // Push
              var tx = rewriter.processTxn(data.transactions[i].tx, data.transactions[i].meta, $id.account);
              if (tx) history.push(tx);
            }

            if (data.marker) {
              params.marker = data.marker;
              $scope.tx_marker = params.marker;
            }
            else {
              // Received all transactions since a marker was not returned
              completed = true;
            }

            if (completed)
              callback(history);
            else
              getTx();
          } else {
            callback(history);
          }
        }).request();
      };

      getTx(0);
    };

    // DateRange filter form
    $scope.submitDateRangeForm = function() {
      $scope.dateMaxView.setDate($scope.dateMaxView.getDate() + 1); // Including last date
      changeDateRange($scope.dateMinView,$scope.dateMaxView);
    };

    $scope.submitMinimumAmountForm = function() {
      updateHistory();
    };

    var changeDateRange = function(dateMin,dateMax) {
      history = [];
      $scope.historyState = 'loading';

      getDateRangeHistory(dateMin,dateMax,function(hist){
        $scope.$apply(function () {
          history = hist;
          $scope.historyState = 'ready';
          updateHistory();
        })
      })
    };

    // All the currencies
    $scope.$watch('balances', function(){
      updateCurrencies();
    });

    // Types filter has been changed
    $scope.$watch('types', function(){
      var arr = [];
      var checked = {};
      _.each($scope.types, function(type,index){
        if (type.checked) {
          arr = arr.concat(type.types);
        }

        checked[index] = {
          checked: !!type.checked
        };
      });
      $scope.filters.types = arr;

      if (!store.disabled) {
        store.set('ripple_history_type_selections', checked);
      }
    }, true);

    if (!store.disabled) {
      $scope.$watch('filters', function(){
        store.set('ripple_history_filters', $scope.filters);
      }, true);
    }

    $scope.$watch('filters.types', function(){
      updateHistory();
    }, true);

    // Currency filter has been changed
    $scope.$watch('filters.currencies', function(){
      updateCurrencies();
      updateHistory();
    }, true);

    // New transactions
    $scope.$watchCollection('history',function(){
      history = $scope.history;

      updateHistory();

      // Update currencies
      if (history.length)
        updateCurrencies();
    },true);

    // Updates the history collection
    var updateHistory = function (){

      //$scope.typeUsage = [];
      //$scope.currencyUsage = [];
      $scope.historyShow = [];

      if (history.length) {
        var dateMin, dateMax;

        $scope.minLedger = 0;

        var currencies = _.map($scope.filters.currencies,function(obj,key){return obj.checked ? key : false});
        history.forEach(function(event)
        {

          // Calculate dateMin/dateMax. Used in date filter view
          if (!$scope.dateMinView) {
            if (!dateMin || dateMin > event.date)
              dateMin = event.date;

            if (!dateMax || dateMax < event.date)
              dateMax = event.date;
          }

          var affectedCurrencies = _.map(event.affected_currencies, function (currencyCode) {
            return ripple.Currency.from_json(currencyCode).to_human();
          });

          // Update currencies
          historyCurrencies = _.union(historyCurrencies, affectedCurrencies); // TODO put in one large array, then union outside of foreach

          // Calculate min ledger. Used in "load more"
          if (!$scope.minLedger || $scope.minLedger > event.ledger_index)
            $scope.minLedger = event.ledger_index;

          // Type filter
          if (event.transaction && !_.contains($scope.filters.types,event.transaction.type))
            return;

          // Some events don't have transactions.. this is a temporary fix for filtering offers
          else if (!event.transaction && !_.contains($scope.filters.types,'offernew'))
            return;

          // Currency filter
          if ($scope.filters.currencies_is_active && _.intersection(currencies,event.affected_currencies).length <= 0)
            return;

          var effects = [];
          var isFundedTrade = false; // Partially/fully funded
          var isCancellation = false;

          if (event.effects) {
            // Show effects
            $.each(event.effects, function(){
              var effect = this;
              switch (effect.type) {
                case 'offer_funded':
                case 'offer_partially_funded':
                case 'offer_bought':
                  isFundedTrade = true;
                  /* falls through */
                case 'offer_cancelled':
                  if (effect.type === 'offer_cancelled') {
                    isCancellation = true;
                    if (event.transaction && event.transaction.type === 'offercancel')
                      return;
                  }
                  effects.push(effect);
                  break;
              }
            });

            event.showEffects = effects;

            // Trade filter - remove open orders that haven't been filled/partially filled
            if (_.contains($scope.filters.types,'exchange') && !_.contains($scope.filters.types,'offercancel')) {
              if ((event.transaction && event.transaction.type === 'offernew' && !isFundedTrade) || isCancellation)
                return
            }

            effects = [ ];

            var amount, maxAmount;
            var minimumAmount = $scope.filters.minimumAmount;

            // Balance changer effects
            $.each(event.effects, function(){
              var effect = this;
              switch (effect.type) {
                case 'fee':
                case 'balance_change':
                case 'trust_change_balance':
                  effects.push(effect);

                  // Minimum amount filter
                  if (effect.type === 'balance_change' || effect.type === 'trust_change_balance') {
                    amount = effect.amount.abs().is_native()
                      ? effect.amount.abs().to_number() / 1000000
                      : effect.amount.abs().to_number();

                    if (!maxAmount || amount > maxAmount)
                      maxAmount = amount;
                    }
                  break;
              }
            });

            // Minimum amount filter
            if (maxAmount && minimumAmount > maxAmount)
              return;

            event.balanceEffects = effects;
          }

          // Don't show sequence update events
          if (event.effects && 1 === event.effects.length && event.effects[0].type == 'fee')
            return;

          // Push events to history collection
          $scope.historyShow.push(event);

          // Type and currency usages
          // TODO offers/trusts
          //if (event.transaction)
          //  $scope.typeUsage[event.transaction.type] = $scope.typeUsage[event.transaction.type] ? $scope.typeUsage[event.transaction.type]+1 : 1;

          //event.affected_currencies.forEach(function(currency){
          //  $scope.currencyUsage[currency] = $scope.currencyUsage[currency]? $scope.currencyUsage[currency]+1 : 1;
          //});
        });

        if ($scope.historyShow.length && !$scope.dateMinView) {
          setValidDateOnScopeOrNullify('dateMinView', dateMin);
          setValidDateOnScopeOrNullify('dateMaxView', dateMax);
        }
      }
    };

    // Update the currency list
    var updateCurrencies = function (){
      if (!$.isEmptyObject($scope.balances)) {
        var currencies = _.union(
          ['XRP'],
          _.map($scope.balances,function(obj,key){return obj.total.currency().to_human();}),
          historyCurrencies
        );

        var objCurrencies = {};

        var firstProcess = $.isEmptyObject($scope.filters.currencies);

        $scope.filters.currencies_is_active = false;

        _.each(currencies, function(currency){
          var checked = ($scope.filters.currencies[currency] && $scope.filters.currencies[currency].checked) || firstProcess;
          objCurrencies[currency] = {'checked':checked};

          if (!checked)
            $scope.filters.currencies_is_active = true;
        });

        $scope.filters.currencies = objCurrencies;
      }
    };

    var setValidDateOnScopeOrNullify = function(key, value) {
      if (isNaN(value) || value == null) {
        $scope[key] = null;
      } else {
        $scope[key] = new Date(value);
      }
    };

    $scope.loadMore = function () {
      var dateMin = $scope.dateMinView;
      var dateMax = $scope.dateMaxView;

      $scope.historyState = 'loading';

      var limit = 100; // TODO why 100?

      var params = {
        account: $id.account,
        ledger_index_min: -1,
        limit: limit,
        marker: $scope.tx_marker
      };

      $network.remote.request_account_tx(params)
      .on('success', function(data) {
        $scope.$apply(function () {
          if (data.transactions.length < limit) {

          }

          $scope.tx_marker = data.marker;

          if (data.transactions) {
            var transactions = [];

            data.transactions.forEach(function (e) {
              var tx = rewriter.processTxn(e.tx, e.meta, $id.account);
              if (tx) {
                var date = ripple.utils.toTimestamp(tx.date);

                if (dateMin && dateMax) {
                  if (date < dateMin.getTime() || date > dateMax.getTime())
                    return;
                } else if (dateMax && date > dateMax.getTime()) {
                  return;
                } else if (dateMin && date < dateMin.getTime()) {
                  return;
                }
                transactions.push(tx);
              }
            });

            var newHistory = _.uniq(history.concat(transactions),false,function(ev){return ev.hash});

            $scope.historyState = (history.length === newHistory.length) ? 'full' : 'ready';
            history = newHistory;
            updateHistory();
          }
        });
      }).request();
    }
  }]);
};

module.exports = HistoryTab;
