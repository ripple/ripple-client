var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var HistoryTab = function ()
{
  Tab.call(this);
};

util.inherits(HistoryTab, Tab);

HistoryTab.prototype.mainMenu = 'wallet';

HistoryTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/history.jade')();
};

HistoryTab.prototype.angular = function (module) {
  module.controller('HistoryCtrl', ['$scope', 'rpId', 'rpNetwork',
                                     function ($scope, $id, $network)
  {
    if (!$id.loginStatus) return $id.goId();

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

    if (store.get('ripple_history_types')) {
      $scope.types = store.get('ripple_history_types');
    } else {
      $scope.types = [
        {
          'name': 'sent',
          'types': ['sent'],
          'checked':true
        }, {
          'name': 'received',
          'types': ['received'],
          'checked':true
        }, {
          'name': 'trusts',
          'types': ['trusting','trusted'],
          'checked':true
        }, {
          'name': 'offers',
          'types': ['offernew','offercancel'],
          'checked':true
        }, {
          'name': 'other',
          'types': ['accountset'],
          'checked':true
        }
      ];
    }

    // Filters
    if (store.get('ripple_history_filters')) {
      $scope.filters = store.get('ripple_history_filters');
    } else {
      $scope.filters = {
        'currencies_is_active': false, // we do the currency filter only if this is true, which happens when at least one currency is off
        'currencies': {},
        'types': ['sent','received','trusting','trusted','offernew','offercancel'],
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
              var date = (data.transactions[i].tx.date + 0x386D4380) * 1000;

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

            params.marker = {'ledger':data.transactions[i-1].tx.inLedger,'seq':0};
            $scope.tx_marker = params.marker;

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
      $scope.history = [];
      $scope.historyState = 'loading';

      getDateRangeHistory(dateMin,dateMax,function(history){
        $scope.$apply(function () {
          $scope.history = history;
          $scope.historyState = 'ready';
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
      for (var i=0;i<$scope.types.length;i++)
        if ($scope.types[i].checked)
          arr = arr.concat($scope.types[i].types);
      $scope.filters.types = arr;

      store.set('ripple_history_types', $scope.types);
    }, true);

    $scope.$watch('filters', function(){
      store.set('ripple_history_filters', $scope.filters);
    }, true);

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
      // TODO This function has a double call on a history change. Don't know why
      // This is a temporoary fix.
      if (latest && $scope.history[$scope.history.length-1] && latest.hash === $scope.history[$scope.history.length-1].hash)
        return;

      updateHistory();

      // Update currencies
      if ($scope.history.length)
        updateCurrencies();

      latest = $.extend(true, {}, $scope.history[$scope.history.length-1]);
    },true);

    // Updates the history collection
    var updateHistory = function (){

      //$scope.typeUsage = [];
      //$scope.currencyUsage = [];
      $scope.historyShow = [];

      if ($scope.history.length) {
        var dateMin, dateMax;

        $scope.minLedger = 0;

        var currencies = _.map($scope.filters.currencies,function(obj,key){return obj.checked ? key : false});
        $scope.history.forEach(function(event)
        {
          // Calculate dateMin/dateMax. Used in date filter view
          if (!$scope.dateMinView) {
            if (!dateMin || dateMin > event.date)
              dateMin = event.date;

            if (!dateMax || dateMax < event.date)
              dateMax = event.date;
          }

          // Update currencies
          historyCurrencies = _.union(historyCurrencies, event.affected_currencies); // TODO put in one large array, then union outside of foreach

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

          if (event.effects) {
            // Show effects
            $.each(event.effects, function(){
              var effect = this;
              switch (effect.type) {
                case 'offer_funded':
                case 'offer_partially_funded':
                case 'offer_bought':
                case 'offer_canceled':
                  if (effect.type === 'offer_canceled' && event.transaction.type === 'offerCancel') {
                    return;
                  }
                  effects.push(effect);
                  break;
              }
            });

            event.showEffects = effects;

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
          $scope.dateMinView = new Date(dateMin);
          $scope.dateMaxView = new Date(dateMax);
        }
      }
    };

    // Update the currency list
    var updateCurrencies = function (){
      if (!$.isEmptyObject($scope.balances)) {
        var currencies = _.union(
          ['XRP'],
          _.map($scope.balances,function(obj,key){return key.toUpperCase()}),
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

    $scope.loadMore = function () {
      var dateMin;

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
                transactions.push(tx);

                // Min date
                if (!dateMin || tx.date < dateMin)
                  dateMin = tx.date;
              }
            });

            var newHistory = _.uniq($scope.history.concat(transactions),false,function(ev){return ev.hash});

            $scope.historyState = ($scope.history.length === newHistory.length) ? 'full' : 'ready';
            $scope.history = newHistory;
            $scope.dateMinView = new Date(dateMin);
          }
        });
      }).request();
    }
  }]);
};

module.exports = HistoryTab;
