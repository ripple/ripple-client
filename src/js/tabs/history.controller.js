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
  module.controller('HistoryCtrl', ['$scope', 'rpId', 'rpNetwork', 'rpTracker', 'rpAppManager', '$routeParams', '$location',
                                     function ($scope, id, network, rpTracker, appManager, $routeParams, $location)
  {
    // Open/close states of individual history items
    $scope.details = [];
    $scope.pagination = {
      currentPage: $routeParams.page ? $routeParams.page : 1,
      transactionsPerPage: Options.transactions_per_page
    };

    $scope.loadingHistory = true;

    // Types
    $scope.types = [
      {
        name: 'Payments & Orders',
        types: ['Payment', 'OfferCreate', 'OfferCancel'],
        checked: $routeParams.types && $routeParams.types.indexOf('Payment,OfferCreate,OfferCancel') !== -1
      },
      {
        name: 'Gateways',
        types: ['TrustSet'],
        checked: $routeParams.types && $routeParams.types.indexOf('TrustSet') !== -1
      },
      {
        name: 'Other',
        types: ['AccountSet'],
        checked: $routeParams.types && $routeParams.types.indexOf('AccountSet') !== -1
      }
    ];

    $scope.dateMinView = $routeParams.start ? new Date($routeParams.start) : '';
    $scope.dateMaxView = $routeParams.end ? new Date($routeParams.end) : '';
    $scope.customDate = $scope.dateMinView || $scope.dateMaxView;

    // History collection
    $scope.historyShow = [];
    $scope.historyCsv = '';

    // Type filter
    $scope.$watch('types', function(newVal, oldVal){
      if (!oldVal || newVal == oldVal) return;

      $location.url($scope.generateUrl());
    }, true);

    // Custom date
    $scope.$watch('customDate', function(){
      if (!$scope.customDate && ($scope.dateMinView || $scope.dateMaxView)) {
        $scope.dateMinView = null;
        $scope.dateMaxView = null;

        $location.url($scope.generateUrl());
      }
    });

    $scope.$watch('pagination.currentPage', function(){
      if ($scope.pagination.currentPage === $routeParams.page) return;

      $location.url($scope.generateUrl());
    });

    // Initial history load
    var initialLoad = $scope.$watch('userHistory', function(){
      if ($scope.noUserHistory) $scope.loadingHistory = false;
      if (!$scope.userHistory) return;

      loadHistory();
      initialLoad();
    });

    $scope.submitDateRangeForm = function() {
      $location.url($scope.generateUrl());
    };

    $scope.generateUrl = function (page) {
      var filtersLine = '';

      // Page
      if (!page)
        page = $scope.pagination.currentPage;

      // Types
      var selectedTypesObjects = _.where($scope.types, {checked: true});
      var selectedTypesString = _.map(selectedTypesObjects, 'types').join(',');

      // select all types if empty
      selectedTypesString = selectedTypesString
        ? selectedTypesString
        : _.map($scope.types, 'types').join(',');

      if (selectedTypesString) filtersLine += '&types=' + selectedTypesString;

      // Date range
      if ($scope.dateMinView) {
        filtersLine += '&start=' + $scope.dateMinView.toISOString();
      }

      if ($scope.dateMaxView) {
        filtersLine += '&end=' + $scope.dateMaxView.toISOString();
      }

      if ($routeParams.types !== selectedTypesString)
        page = 1;

      return '/history'
        + '?page=' + page
        + filtersLine
    };

    function loadHistory() {
      if (!$scope.userHistory || !$routeParams.types) return;

      $scope.historyShow = [];

      var options = {
        limit: Options.transactions_per_page,
        offset: $scope.pagination.currentPage > 1
          ? ($scope.pagination.currentPage - 1) * Options.transactions_per_page
          : 0
      };

      if ($routeParams.types) {
        options.type = $routeParams.types;
      }
      if ($routeParams.start) options.start = $routeParams.start;
      if ($routeParams.end) options.end = $routeParams.end;

      // Get history
      $scope.userHistory.getHistory(options)
        .success(function(data){
          $scope.loadingHistory = false;
          updateHistory(data);
        })
        .error(function(){
          $scope.loadingHistory = false;
        });

      // Get transaction count
      $scope.userHistory.getCount(options)
        .success(function(response){
          $scope.pagination.count = response.count;
        });
    }

    function updateHistory(data){
      if (!data.transactions.length) return;

      data.transactions.forEach(function(transaction)
      {
        var event = rewriter.processTxn(
          transaction.tx,
          transaction.meta,
          id.account);

        if (!event) return;

        var effects = [];
        var isFundedTrade = false; // Partially / fully funded
        var isCancellation = false;

        if (event.effects) {
          // Show effects
          $.each(event.effects, function(){
            var _this = this;

            switch (_this.type) {
              case 'offer_funded':
              case 'offer_partially_funded':
              case 'offer_bought':
                isFundedTrade = true;
                /* falls through */
              case 'offer_cancelled':
                if (_this.type === 'offer_cancelled') {
                  isCancellation = true;
                  if (event.transaction && event.transaction.type === 'offercancel')
                    return;
                }
                effects.push(_this);
                break;
            }
          });

          event.showEffects = effects;

          effects = [];

          // Balance changer effects
          $.each(event.effects, function(){
            var _this = this;

            switch (_this.type) {
              case 'fee':
              case 'balance_change':
              case 'trust_change_balance':
                effects.push(_this);
                break;
            }
          });

          event.balanceEffects = effects;
        }

        // Push events to history collection
        $scope.historyShow.push(event);
      });
    }

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
        lineTemplate.Fee = formatAmount(histLine.fee);
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
