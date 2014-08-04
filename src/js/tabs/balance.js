var util = require('util'),
    Tab = require('../client/tab').Tab;

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
  

  module.controller('BalanceCtrl', ['$rootScope', 'rpId', '$filter', '$http', 'rpAppManager',
                                     function ($scope, $id, $filter, $http, appManager)
  {
    if (!$id.loginStatus) return $id.goId();
    
    
    // In the following, we get and watch for changes to data that is used to
    // calculate the pie chart and aggregate balance. This data includes:
    // -What balances the user holds
    // -What (if any) market value in terms of XRP each balance has, according to
    //  https://api.ripplecharts.com/api/exchangeRates
    // -What metric the user has chosen to calculate the aggregate value in
    
    
    // When the selected value metric changes, update the displayed amount.
    
    $scope.selectedValueMetric || ($scope.selectedValueMetric = "XRP");
    
    $scope.changeMetric = function(scope){
      $scope.selectedValueMetric = scope.selectedValueMetric;
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
      console.log("BALANCES UPDATED!");
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
        $http.post("https://api.ripplecharts.com/api/exchangeRates", {pairs:pairs,last:true})
        .success(function(response){
          var anything = false;
          for (var i=0; i<response.length; i++) {
            var pair = response[i];
            if (pair.last > 0) { // Disregard unmarketable assets
              $scope.exchangeRates[pair.base.currency+":"+pair.base.issuer] = pair.last; 
              anything || (anything = true);
            }
          }
          if (anything) {
            $scope.exchangeRatesNonempty || ($scope.exchangeRatesNonempty = true);
          }
        });
      } else {
        $scope.exchangeRatesNonempty || ($scope.exchangeRatesNonempty = true);
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
          var issuerName = $filter('rpcontactname')(curIssuer[1]);
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
      $scope.aggregateValueDisplayed = $scope.aggregateValueAsXrp / $scope.exchangeRates[$scope.selectedValueMetric];
    }
    

  }]);
};

module.exports = BalanceTab;
