var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.tabName = 'balance';
BalanceTab.prototype.mainMenu = 'wallet';

BalanceTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

BalanceTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/balance.jade')();
};

BalanceTab.prototype.angular = function (module)
{
  

  module.controller('BalanceCtrl', ['$rootScope', 'rpId', 'rpNetwork', '$filter', '$http', 'rpAppManager',
                                     function ($scope, $id, $network, $filter, $http, appManager)
  {
    if (!$id.loginStatus) return $id.goId();

    // In the following, we get and watch for changes to data that is used to
    // calculate the pie chart and aggregate balance. This data includes:
    // -What balances the user holds
    // -What (if any) market value in terms of XRP each balance has, according to
    //  https://api.ripplecharts.com/api/exchangeRates
    // -What metric the user has chosen to calculate the aggregate value in
    
    
    // When the selected value metric changes, update the displayed amount.
    
    ($scope.selectedValueMetric = store.get('balance')) || ($scope.selectedValueMetric = "XRP");
    
    $scope.changeMetric = function(scope){
      $scope.selectedValueMetric = scope.selectedValueMetric;
      
      //NOTE: this really should be stored in the blob or
      //scoped to the blob_id so that it changes based on 
      //which account is being viewed
      store.set('balance', $scope.selectedValueMetric);
    };
    
    $scope.$watch("selectedValueMetric", function(){
      if ($scope.selectedValueMetric && $scope.aggregateValueAsXrp) {
        updateAggregateValueDisplayed();
      }
    })
    
    
    // Maintain a dictionary for the value of each "currency:issuer" pair, denominated in XRP.
    // Fetch the data from RippleCharts, and refresh it whenever any non-XRP balances change.
    // When exchangeRates changes, update the aggregate value, and the list of available value metrics,
    // and also check for negative balances to see if the user should be notified.
    
    $scope.exchangeRates || ($scope.exchangeRates = {"XRP":1});
    
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
          counter:{currency:"XRP"}
        }
      });
      if (pairs.length) {
        $scope.exchangeRatesNonempty = false;
        $http.post("https://api.ripplecharts.com/api/exchangeRates", {pairs:pairs,last:true})
        .success(function(response){

          for (var i=0; i<response.length; i++) {
            var pair = response[i];
            if (pair.last > 0) { // Disregard unmarketable assets
              $scope.exchangeRates[pair.base.currency+":"+pair.base.issuer] = pair.last; 
            }
          }
          
          $scope.exchangeRatesNonempty = true;
          console.log("Exchange Rates: ", $scope.exchangeRates);
        });
      } else {
        $scope.exchangeRatesNonempty = true;
      }
    }

    $scope.$on('$balancesUpdate', updateExchangeRates);

    $scope.$watch("exchangeRates", function(){
      if ($scope.exchangeRates) {
        var isAmbiguous = {};
        var okser = Object.keys($scope.exchangeRates);
        for (var i=0; i<okser.length; i++) {
          var cur = okser[i].split(":")[0];
          if (!isAmbiguous[cur] || !isAmbiguous.hasOwnProperty(cur)) {
            // (In case there's a currency called "constructor" or something)
            for (var j=i+1; j<okser.length; j++) {
              var cur2 = okser[j].split(":")[0];
              if (cur === cur2) {
                isAmbiguous[cur] = true;
                break;
              }
            }
          }
        }
        $scope.valueMetrics = okser.map(function(code){
          var curIssuer = code.split(":");
          var currencyName = $filter('rpcurrency')(ripple.Amount.from_human("0 "+curIssuer[0])); //This is really messy
          var issuerName = $filter('rpripplename')(curIssuer[1], tilde=true);
          return {
            code: code,
            text: currencyName + (isAmbiguous[curIssuer[0]] ? " ("+ issuerName +")" : "")
          };
        });
        
        updateAggregateValueAsXrp();
      }
    }, true);
    
    
    // Whenever the XRP balance changes, update the aggregate value, but no need to refresh exchangeRates.
    // Update the displayed amount.
    
    $scope.$watch("account.Balance", updateAggregateValueAsXrp);
    
    function updateAggregateValueAsXrp() {
      if ( $scope.account.Balance) {
        var av = $scope.account.Balance / 1000000;
        for (var cur in $scope.balances) {if ($scope.balances.hasOwnProperty(cur)){
          var components = $scope.balances[cur].components;
          for (var issuer in components) {if (components.hasOwnProperty(issuer)){
            var rate = ( $scope.exchangeRates[cur+":"+issuer] || 0);
            var sbAsXrp = components[issuer].to_number() * rate;
            av += sbAsXrp;
          }}
        }}
        $scope.aggregateValueAsXrp = av;
        updateAggregateValueDisplayed();
      }
    }
    
    function updateAggregateValueDisplayed() {
      var metric = $scope.exchangeRates[$scope.selectedValueMetric];
      if (!metric) {
        $scope.selectedValueMetric = "XRP";
        $scope.changeMetric($scope);
        metric = $scope.exchangeRates[$scope.selectedValueMetric];
      }

      $scope.aggregateValueAsMetric = $scope.aggregateValueAsXrp / metric;
      
      if($scope.selectedValueMetric === "XRP" || 
          $scope.selectedValueMetric === "0158415500000000C1F76FF6ECB0BAC600000000:rDRXp3XC6ko3JKNh1pNrDARZzFKfBzaxyi" ||
          $scope.selectedValueMetric === "015841551A748AD2C1F76FF6ECB0CCCD00000000:rs9M85karFkCRjvc6KMWn8Coigm9cbcgcx" ) 
      {
        $scope.aggregateValueDisplayed = $scope.aggregateValueAsMetric.toFixed(4).substring(0, (($scope.aggregateValueAsXrp / metric).toFixed(4)).length - 5);
        $scope.aggregateValueDisplayedDecimal = $scope.aggregateValueAsMetric.toFixed(4).substring((($scope.aggregateValueAsXrp / metric).toFixed(4)).length - 5, (($scope.aggregateValueAsXrp / metric).toFixed(4)).length);
      } 
      else {
        $scope.aggregateValueDisplayed = $scope.aggregateValueAsMetric.toFixed(2).substring(0, (($scope.aggregateValueAsXrp / metric).toFixed(2)).length - 3);
        $scope.aggregateValueDisplayedDecimal = $scope.aggregateValueAsMetric.toFixed(2).substring((($scope.aggregateValueAsXrp / metric).toFixed(2)).length - 3, (($scope.aggregateValueAsXrp / metric).toFixed(2)).length);

      }
    }

    var history = [];

    var getDateRangeHistory = function(dateMin,dateMax,callback)
    {
      if (!$id.account) return;
      var completed = false;
      var history = [];

      var params = {
        'account': $id.account,
        'ledger_index_min': -1
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

    var changeDateRange = function(dateMin,dateMax) {
      history = [];
      $scope.trendValueAsPercentage = undefined;

      getDateRangeHistory(dateMin,dateMax,function(hist){
        $scope.$apply(function () {
          history = hist;
          updateTrend();
        })
      })
    };

    var updateTrend = function() { 
      $scope.trendMap = {}
      var trendMap = _.reduce(history, function(map, event) {
          _.forEach(event.effects, function(effect){
            switch (effect.type) {
              case 'fee':
              case 'balance_change':
              case 'trust_change_balance':
                currency = effect.amount.is_native() ? "XRP" : (effect.currency + ":" + effect.counterparty);
                if (typeof map[currency] === "undefined") map[currency] = 0;

                map[currency] += effect.amount.is_native()
                  ? effect.amount.to_number() / 1000000
                  : effect.amount.to_number();
                break;
              }
            });
          return map;
        }, {});
      $scope.trendMap = trendMap;
    }

    $scope.selectedTrendSpan = 86400000;
    
    $scope.changeTrendSpan = function(scope){
      $scope.selectedTrendSpan = scope.selectedTrendSpan;
    };
    
    var refreshTrend = function() {
      changeDateRange(new Date(new Date() - $scope.selectedTrendSpan),new Date());
    };

    $scope.$watch("selectedTrendSpan", refreshTrend);
    $scope.$watch("account.Balance", refreshTrend);

    $scope.$watch("aggregateValueAsXrp", updateTrendValue);
    $scope.$watch("trendMap", updateTrendValue);
    
    function updateTrendValue() {
      if (!$scope.trendMap) return;
      var av = $scope.aggregateValueAsXrp;
      for (var cur in $scope.trendMap) {if ($scope.trendMap.hasOwnProperty(cur)){
        var rate = ( $scope.exchangeRates[cur] || 0);
        var sbAsXrp = $scope.trendMap[cur] * rate;
        av -= sbAsXrp;
      }}
      $scope.trendValueAsPercentage = ($scope.aggregateValueAsXrp - av) / av;
    }

  }]);

  module.directive('rpFlatSelect', [function () {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) { 
        var expanded = true;

        var collapse = function() {
          expanded = false;
          element = this;
          el.find('option').each(function(i, option){
            $option = $(option);
            $option.attr("rp-flat-select-text", $option.html());
            if (i != element.selectedIndex)
              $option.html("");
          });
          el.width("auto");
        };

        var expand = function() {
          if (expanded) return;
          expanded = true;
          element = this;
          el.width(el.width());
          el.find('option').each(function(i, option){
            $option = $(option);
            if (!$option.attr("rp-flat-select-text"))
              $option.attr("rp-flat-select-text", $option.html());
            if ($option.html() != $option.attr("rp-flat-select-text"))
              $option.html($option.attr("rp-flat-select-text"));
          });
        };

        el.focus(expand);
        el.mouseover(expand);
        el.blur(collapse);
        el.change(function(){
          collapse.apply(this);
          expand.apply(this);
        });

        optionsAttr = el.attr('ng-options') || el.attr('data-ng-options');
        if (optionsAttr) {
          watch = $.trim(optionsAttr.split('|')[0]).split(' ').pop();
          scope.$watch(watch, function(){
            if (el.is(":focus")) return;
            collapse.apply(el.first()[0]);
          });
        }
      }
    };
  }]);
};

module.exports = BalanceTab;
