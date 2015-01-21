var util = require('util'),
    webUtil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter'),
    Amount = ripple.Amount;

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
  module.controller('HistoryCtrl', ['$scope', 'rpId', 'rpNetwork', 'rpTracker', 'rpAppManager', '$routeParams',
                                     function ($scope, id, network, rpTracker, appManager, $routeParams)
  {
    // Open/close states of individual history items
    $scope.details = [];

    var history = [];

    // History collection
    $scope.historyShow = [];
    $scope.historyCsv = '';

    // Currencies from history
    var historyCurrencies = [];

    // Latest transaction
    var latest;

    $scope.orderedTypes = ['sent', 'received', 'gateways', 'trades', 'orders', 'other'];

    $scope.types = {
      sent: {
        'types': ['sent'],
        'checked': true
      },
      received: {
        'types': ['received'],
        'checked': true
      },
      gateways: {
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

    // History states
    $scope.$watch('loadState.transactions',function(){
      $scope.historyState = !$scope.loadState.transactions ? 'loading' : 'ready';
    });

    //$scope.typeUsage = [];
    //$scope.currencyUsage = [];

    if (store.get('ripple_history_type_selections')) {
      $scope.types = $.extend(true,$scope.types,store.get('ripple_history_type_selections'));
    }

    if ($routeParams.f && _.has($scope.types, $routeParams.f)) {
      _.each($scope.types, function(value, key) {
        value.checked = $routeParams.f == key;
      });
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
        account: id.account,
        ledger_index_min: -1,
        limit: 200,
        binary: true
      };

      getTx();

      function getTx() {
        network.remote.request_account_tx(params, function(err, data) {
          if (!data.transactions.length) {
            return callback(history);
          }

          for (var i=0;i<data.transactions.length;i++) {
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
      };
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
        });
      });
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

        var currencies = _.map($scope.filters.currencies,function(obj,key){return obj.checked ? key : false;});
        history.forEach(function(event)
        {

          // Calculate dateMin/dateMax. Used in date filter view
          if (!$scope.dateMinView) {
            if (!dateMin || dateMin > event.date)
              dateMin = event.date;

            if (!dateMax || dateMax < event.date)
              dateMax = event.date;
          }

          var affectedCurrencies = _.map(event.affectedCurrencies, function (currencyCode) {
            return ripple.Currency.from_json(currencyCode).to_human();
          });

          // Update currencies
          historyCurrencies = _.union(historyCurrencies, affectedCurrencies); // TODO put in one large array, then union outside of foreach

          // Calculate min ledger. Used in "load more"
          if (!$scope.minLedger || $scope.minLedger > event.ledger_index)
            $scope.minLedger = event.ledger_index;

          // Type filter
          if (event.transaction && event.transaction.type === 'error') ; // Always show errors
          else if (event.transaction && !_.contains($scope.filters.types,event.transaction.type))
            return;

          // Some events don't have transactions.. this is a temporary fix for filtering offers
          else if (!event.transaction && !_.contains($scope.filters.types,'offernew'))
            return;

          // Currency filter
          //if ($scope.filters.currencies_is_active && _.intersection(currencies,event.affectedCurrencies).length <= 0)
          //  return;

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
                return;
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

          //event.affectedCurrencies.forEach(function(currency){
          //  $scope.currencyUsage[currency] = $scope.currencyUsage[currency]? $scope.currencyUsage[currency]+1 : 1;
          //});
        });

        if ($scope.historyShow.length && !$scope.dateMinView) {
          //setValidDateOnScopeOrNullify('dateMinView', dateMin);
          //setValidDateOnScopeOrNullify('dateMaxView', dateMax);
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
        account: id.account,
        ledger_index_min: -1,
        limit: limit,
        marker: $scope.tx_marker,
        binary: true
      };

      network.remote.request_account_tx(params, function(err, data) {
        $scope.$apply(function () {
          if (data.transactions.length < limit) {

          }

          $scope.tx_marker = data.marker;

          if (data.transactions) {
            var transactions = [];

            data.transactions.forEach(function (e) {
              var tx = rewriter.processTxn(e.tx, e.meta, id.account);
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

            var newHistory = _.uniq(history.concat(transactions),false,function(ev) {return ev.hash;});

            $scope.historyState = (history.length === newHistory.length) ? 'full' : 'ready';
            history = newHistory;
            updateHistory();
          }
        });
      });
    };

    var exists = function(pty) {
      return typeof pty !== 'undefined';
    };

    // Change first letter of string to uppercase or lowercase
    var capFirst = function(str, caps) {
      var first = str.charAt(0);
      return (caps ? first.toUpperCase() : first.toLowerCase()) + str.slice(1);
    };

    var rippleName = function(address) {
      var name;
      if (address !== '') name = webUtil.isContact($scope.userBlob.data.contacts, address);
      return name ? name : address;
    };

    var issuerToString = function(issuer) {
      var iss = issuer.to_json();
      return typeof iss === 'number' && isNaN(iss) ? '' : iss;
    };

    // Convert Amount value to human-readable format
    var formatAmount = function(amount) {
      var formatted = '';

      if (amount instanceof Amount) {
        formatted = amount.to_human({group_sep: false, precision: 2});

        // If amount is very small and only has zeros (ex. 0.0000), raise precision
        if (formatted.length > 1 && 0 === +formatted) {
          formatted = amount.to_human({group_sep: false, precision: 20, max_sig_digits: 5});
        }
      }

      return formatted;
    };

    $scope.exportCsv = function() {

      // Header (1st line) of CSV with name of each field
      // Ensure that the field values for each row added in addLineToCsvToCsv() correspond in this order
      var csv = 'Date,Time,Ledger Number,Transaction Type,Trust address,' +
        'Address sent from,Amount sent/sold,Currency sent/sold,Issuer of sent/sold ccy,' +
        'Address sent to,Amount received,Currency received,Issuer of received ccy,' +
        'Executed Price,Network Fee paid,Transaction Hash\r\n';

      var addLineToCsv = function(line) {
        // Ensure that the fields match the CSV header initialized in var csv
        csv += [ line.Date, line.Time, line.LedgerNum, line.TransType, line.TrustAddr,
          line.FromAddr, line.SentAmount, line.SentCcy, line.SentIssuer,
          line.ToAddr, line.RecvAmount, line.RecvCcy, line.RecvIssuer,
          line.ExecPrice, line.Fee, line.TransHash
          ].join(',') + '\r\n';
      };

      // Convert the fields of interest in buy & sell Amounts to strings in Key/Value pairs
      var getOrderDetails = function(keyVal, buy, sell) {
        if (buy !== null && buy instanceof Amount) {
          keyVal.SentAmount = formatAmount(buy);
          keyVal.SentCcy = buy.currency().get_iso();
          keyVal.SentIssuer = rippleName(issuerToString(buy.issuer()));
        }

        if (sell !== null && sell instanceof Amount) {
          keyVal.RecvAmount = formatAmount(sell);
          keyVal.RecvCcy = sell.currency().get_iso();
          keyVal.RecvIssuer = rippleName(issuerToString(sell.issuer()));
        }
      };

      // Construct a CSV string by:
      // 1) Iterating over each line item in the *displayed* Transaction History
      // 2) If the type of Transaction is in scope, convert the relevant fields to strings in Key/Value pairs
      // 3) Concatenate the strings extracted in (2) in a comma-delimited line and append this line to the CSV
      for (var i = 0; i < $scope.historyShow.length; i++) {
        var  histLine = $scope.historyShow[i],
          transaction = histLine.transaction,
          type = histLine.tx_type,
          dateTime = moment(histLine.date),
          na = 'NA',
          line = {},
          lineTemplate = {},
          lineTrust = {},
          linePayment = {},
          lineOffer = {},
          sent;

        // Unsuccessful transactions are excluded from the export
        var transType = exists(transaction) ? transaction.type : null;
        if (transType === 'failed' || histLine.tx_result !== 'tesSUCCESS') continue;

        // Fields common to all Transaction types
        lineTemplate.Date = dateTime.format('YYYY-MM-DD');
        lineTemplate.Time = dateTime.format('HH:mm:ss');
        lineTemplate.LedgerNum = histLine.ledger_index;
        lineTemplate.Fee = formatAmount(Amount.from_json(histLine.fee));
        lineTemplate.TransHash = histLine.hash;

        // Default type-specific fields to NA, they will be overridden later if applicable
        lineTemplate.TrustAddr = lineTemplate.FromAddr = lineTemplate.ToAddr = na;
        lineTemplate.RecvAmount = lineTemplate.RecvCcy = lineTemplate.ExecPrice = na;

        // Include if Payment, Trust, Offer. Otherwise Exclude.
        if (type === 'TrustSet') {
          // Trust Line (Incoming / Outgoing)
          var trust = '';

          if (transType === 'trusted') trust = 'Incoming ';
          else if (transType === 'trusting') trust = 'Outgoing ';
          else continue;  // unrecognised trust type

          lineTrust.TransType = trust + 'trust line';
          lineTrust.TrustAddr = rippleName(transaction.counterparty);

          lineTrust.SentAmount = formatAmount(transaction.amount);
          lineTrust.SentCcy = transaction.currency; //transaction.amount.currency().get_iso();

          lineTrust.SentIssuer = lineTrust.RecvIssuer = na;

          line = $.extend({}, lineTemplate, lineTrust);
          addLineToCsv(line);
        }
        else if (type === 'Payment' && transType !== null) {
          // Payment (Sent / Received)
          if (transType === 'sent') sent = true;
          else if (transType === 'received') sent = false;
          else continue;  // unrecognised payment type

          linePayment.TransType = capFirst(transType, true) + ' ' + capFirst(type, false);

          if (sent) {
            // If sent, counterparty is Address To
            linePayment.ToAddr = rippleName(transaction.counterparty);
            linePayment.FromAddr = rippleName(id.account);
          }
          else {
            // If received, counterparty is Address From
            linePayment.FromAddr = rippleName(transaction.counterparty);
            linePayment.ToAddr = rippleName(id.account);
          }

          if (exists(transaction.amountSent)) {
            amtSent = transaction.amountSent;
            linePayment.SentAmount = exists(amtSent.value) ? amtSent.value : formatAmount(Amount.from_json(amtSent));
            linePayment.SentCcy = exists(amtSent.currency) ? amtSent.currency : 'XRP';
            if (exists(transaction.sendMax)) linePayment.SentIssuer = rippleName(transaction.sendMax.issuer);
          }

          linePayment.RecvAmount = formatAmount(transaction.amount);
          linePayment.RecvCcy = transaction.currency;
          linePayment.RecvIssuer = rippleName(issuerToString(transaction.amount.issuer()));

          line = $.extend({}, lineTemplate, linePayment);
          addLineToCsv(line);
        }
        else if (type === 'Payment' || type === 'OfferCreate' || type === 'OfferCancel') {
          // Offers (Created / Cancelled / Executed)
          var effect;

          if (transType === 'offernew') {
            getOrderDetails(lineOffer, transaction.gets, transaction.pays);
            lineOffer.TransType = 'Offer Created';

            line = $.extend({}, lineTemplate, lineOffer);
            addLineToCsv(line);
          }
          else if (transType === 'offercancel') {
            for (var e = 0; e < histLine.effects.length; e++) {
              effect = histLine.effects[e];

              if (effect.type === 'offer_cancelled') {
                getOrderDetails(lineOffer, effect.gets, effect.pays);
                lineOffer.TransType = 'Offer Cancelled';

                line = $.extend({}, lineTemplate, lineOffer);
                addLineToCsv(line);

                break;
              }
            }
          }

          for (var s = 0; s < histLine.showEffects.length; s++) {
            effect = histLine.showEffects[s],
              buy = null,
              sell = null;
            lineOffer = {};

            switch (effect.type) {
            case 'offer_bought':
            case 'offer_funded':
            case 'offer_partially_funded':
              // Order fills (partial or full)

              if (effect.type === 'offer_bought') {
                buy = exists(effect.paid) ? effect.paid : effect.pays;
                sell = exists(effect.got) ? effect.got : effect.gets;
              }
              else {
                buy = exists(effect.got) ? effect.got : effect.gets;
                sell = exists(effect.paid) ? effect.paid : effect.pays;
              }

              getOrderDetails(lineOffer, buy, sell);
              lineOffer.TransType = 'Executed offer';
              lineOffer.ExecPrice = formatAmount(effect.price);

              line = $.extend({}, lineTemplate, lineOffer);
              if (s > 0) line.Fee = '';  // Fee only applies once
              addLineToCsv(line);

            break;  // end case
            }
          }
        }
        // else unrecognised Transaction type hence ignored
      }

      // Ensure that historyCsv is set to empty string if there is nothing to download,
      // otherwise the file download will be a single line with header and no data
      $scope.historyCsv = $scope.historyShow.length ? csv : '';
    };

  }]);
};

module.exports = HistoryTab;
