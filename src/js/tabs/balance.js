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
  
  module.directive('rpPieChart', ['$filter', function($filter) {
    var rpcurrency = $filter('rpcurrency');
    
    var exchangeRates = {
      XRP: 1,
      USD: 196,
      BTC: 121000,
      CNY: 32
    };
    
    function drawPieChart(element, scope) {
      var xrpAsSuch = parseInt(scope.drops,10) / 1000000;
      var balancesAsXrp = [xrpAsSuch];
      var totalAsXrp = xrpAsSuch;
      var amounts = ["1"];
      for (var cur in scope.ious) {if (scope.ious.hasOwnProperty(cur)){
        //console.log("ITERATING!");
        var components = scope.ious[cur].components;
        var totalBalance = 0;
        for (var issuer in components) {if (components.hasOwnProperty(issuer)){
          totalBalance += components[issuer].to_number();
        }}
        var totalBalanceAsXrp = totalBalance * (exchangeRates[cur] || 0);
        totalAsXrp += totalBalanceAsXrp;
        balancesAsXrp.push(totalBalanceAsXrp);
        amounts.push(components[issuer]);
      }}
      
      //console.log("!!!!!!!!!!!!!", balancesAsXrp, totalAsXrp);
      
      var shares = balancesAsXrp.map(function(x){return x/totalAsXrp});
      var labels = amounts.map(function(a){return rpcurrency(a)});
      
      var currencyColors = {
        //"__N": "#f00", //RED	
        "BTC": "#fa0", //ORANGE
        "CNY": "#af0", //YELLOW
        "USD": "#0f0", //LIME
        "AUD": "#0fa", //GREEN
        "XRP": "#0af", //BLUE
        //"___": "#00f", //INDIGO
        "CAD": "#a0f", //VIOLET
        "EUR": "#f0a"  //PINK
      };
      
      var colors = labels.map(function(c){return currencyColors[c] || "#00f";});
      
      console.log("COMPUTED PIE:", shares, labels, colors);
      
      
      
      // __________________________________________
      
      
      
      
      // Now the fun stuff begins...
      
      var TAU = Math.PI*2;
      
      var boundaries = [];
      var sum = 0;
      var i;
      for (i=0; i<shares.length; i++) {
        boundaries.push(shares[i]+sum);
        sum += shares[i];
      }
      var boundaryAngles = boundaries.map(function(x){return x*TAU;});
      
      var midpoints = [];
      for (i=0; i<shares.length; i++) {
        midpoints.push((boundaries[i-1]||0) + shares[i]/2);
      }
      var midpointAngles = midpoints.map(function(x){return x*TAU;});
      
      var center = [60,60];
      var circleRadius = 60;
      var labelWidth = 20;
      var labelHeight = 10;
      
      var polarToRect = function(radius, angle) {
        return [
          center[0]+radius*Math.sin(angle), 
          center[1]-radius*Math.cos(angle)
        ];
      };
      
      var sectors = [];
      for (i=0; i<shares.length; i++) {
        var pointA = polarToRect(circleRadius, boundaryAngles[i-1]||0);
        var pointB = polarToRect(circleRadius, boundaryAngles[i]);
        var labelCoords = polarToRect(circleRadius+20, midpointAngles[i]);
        var labelPosition = {
          x: labelCoords[0],
          y: labelCoords[1]
        };
        
        sectors.push({
          path: "M "+center.join(",")+
            " L "+pointA.join(",")+
            " A "+circleRadius+","+circleRadius+
            " 0,"+(shares[i]>0.5?"1":"0")+",1 "+
            pointB.join(",")+" Z",
          color: colors[i],
          labelPosition: labelPosition,
          labelText: labels[i]
        });
      }
      
      console.log("PIE SECTORS!", sectors);
      
      element.find('*').remove();
      element.append('<svg></svg>')
      var svg = element.find('svg').attr({
        width: 120,
        height: 120
      });
      
      
      for (i=0; i<sectors.length; i++) {
        var sector = sectors[i];
        var path = $('<path></path>').appendTo(svg);
        path.attr({
          fill: sector.color,
          stroke: sector.color,
          d: sector.path
        });
      }
      $('<circle></circle>').appendTo(svg).attr({
        fill: "#fff",
        cx:   60,
        cy:   60,
        r:    20
      });
      
      svg.attr({
        "xmlns:svg": "http://www.w3.org/2000/svg",
        "xmlns":     "http://www.w3.org/2000/svg"
      });

      element.html(element.html()); // <- some bullshit right here

      console.log("DONE!!!!!!!!!!!!!!!");
    }
    
    return {
      restrict: 'A',
      scope: {
        drops: '=rpDrops',
        ious: '=rpIous'
      },
      link: function(scope, element, attributes) {
        drawPieChart(element, scope),
        scope.$watch('drops', function() {
          drawPieChart(element, scope);
        });
        scope.$watch('ious', function() {
          drawPieChart(element, scope);
        }, true);
      }
    };
  }]); 
  
  /*
  module.directive('svgCenterText', [function() {
    console.log("MANUFACTURING DIRECTIVE!");
    return {
      priority: -1,
      link: function(scope, element, attrs) {
        //console.log("LINKING DIRECTIVE!");
        //console.log("SCOPE", scope, "ELEMENT", element, "ATTRS", attrs);
        //console.log("DONE LINKING DIRECTIVE!");
        
        //attrs.$observe("y", function(){
        //setTimeout(function(){
          var baseX = attrs.basex;
          var cw = window.getComputedStyle(element[0]).width;
          console.log("WIDTH!", element.width());
          console.log("CW!!!!!!!", cw);
          var computedWidth = parseInt(cw, 10);
          console.log("computedWidth!", computedWidth);
          //var cs = window.getComputedStyle(element[0]);
          //console.log("COMPUTED STYLE!", cs);
          element.attr("x",baseX-computedWidth/2);
          element.attr("cw",computedWidth);
        //}, 5000);
        //});

        //element.attr("hello","world");
        //console.log("EA!!!!!!!!!!!!!!!!");
        //scope.theStyle = window.getComputedStyle(element[0], null);
      }
    };
  }]);
  */

  module.controller('BalanceCtrl', ['$rootScope', 'rpId', 'rpAppManager',
                                     function ($scope, $id, appManager)
  {
    if (!$id.loginStatus) return $id.goId();

    //additional stuff here:
    /*
    $scope.hello = "TESTING!";
    var TAU = Math.PI*2;
    var drawPieChart = function(proportions, labels, colors) {
      var boundaries = [];
      var sum = 0;
      var i;
      for (i=0; i<proportions.length; i++) {
        boundaries.push(proportions[i]+sum);
        sum += proportions[i];
      }
      var boundaryAngles = boundaries.map(function(x){return x*TAU;});
      
      var midpoints = [];
      for (i=0; i<proportions.length; i++) {
        midpoints.push((boundaries[i-1]||0) + proportions[i]/2);
      }
      var midpointAngles = midpoints.map(function(x){return x*TAU;});
      
      var center = [60,60];
      var circleRadius = 60;
      var labelWidth = 20;
      var labelHeight = 10;
      
      var polarToRect = function(radius, angle) {
        return [
          center[0]+radius*Math.sin(angle), 
          center[1]-radius*Math.cos(angle)
        ];
        //console.log("POLAR!", radius, angle, 
      };
      
      var labelDisplacement = function(angle) {
        var a = angle % TAU;
        if (a % (TAU/4) === 0) {
          return 0;
        }
        
        var verticallyDominant = (
          0       <a&&a<= TAU/8   ||
          TAU*3/8 <a&&a<= TAU*5/8 ||
          TAU*7/8 <a&&a<= TAU
        );
        
        a = ( 
          0       <a&&a<= TAU/8   ?  a           :
          TAU/8   <a&&a<= TAU/4   ?  TAU/4 - a   :
          TAU/4   <a&&a<= TAU*3/8 ?  a - TAU/4   :
          TAU*3/8 <a&&a<= TAU/2   ?  TAU/2 - a   :
          TAU/2   <a&&a<= TAU*5/8 ?  a - TAU/2   :
          TAU*5/8 <a&&a<= TAU*3/4 ?  TAU*3/4 - a :
          TAU*3/4 <a&&a<= TAU*7/8 ?  a - TAU*3/4 :
          TAU*7/8 <a&&a<= TAU     ?  TAU - a     :
        0);
        
        var sin = Math.sin(a),
            cos = Math.cos(a),
            tan = Math.tan(a);
        
        if (verticallyDominant) {
          return (labelWidth*sin - labelHeight*sin*tan + labelHeight/cos)/2;
        } else {
          return (labelHeight*cos - labelWidth*cos/tan + labelWidth/sin)/2;
        }
        
      };
      
      var sectors = [];
      for (i=0; i<proportions.length; i++) {
        var pointA = polarToRect(circleRadius, boundaryAngles[i-1]||0);
        var pointB = polarToRect(circleRadius, boundaryAngles[i]);
        var labelCoords = polarToRect(circleRadius+20, midpointAngles[i]);
        var labelPosition = {
          x: labelCoords[0],
          y: labelCoords[1]
        };
        
        //console.log("A:", JSON.stringify(pointA), "B:", JSON.stringify(pointB));
        sectors.push({
          path: "M "+center.join(",")+
            " L "+pointA.join(",")+
            " A "+circleRadius+","+circleRadius+
            " 0,"+(proportions[i]>0.5?"1":"0")+",1 "+
            pointB.join(",")+" Z",
          color: colors[i],
          labelPosition: labelPosition,
          labelAmount: labels[i]
        });
      }
      
      $scope.sectors = sectors;
      //console.log("SECTORS!", $scope.sectors);
      
      
      
    };
    
    
    
  
    
    $scope.sectors = [];
    
    $scope.addPath = function(){
      //console.log("GO!");
      //$scope.sectors.push(sectors.shift());
      //console.log($scope.sectors);
      computePieSectors();
    };
    
    
    console.log("SCOPE!", $scope);
    
    var exchangeRates = {
      XRP: 1,
      USD: 196,
      BTC: 121000,
      CNY: 32
    };
    
    var currencyColors = {
      //"__N": "#f00", //RED	
      "BTC": "#fa0", //ORANGE
      "CNY": "#af0", //YELLOW
      "USD": "#0f0", //LIME
      "AUD": "#0fa", //GREEN
      "XRP": "#0af", //BLUE
      //"___": "#00f", //INDIGO
      "CAD": "#a0f", //VIOLET
      "EUR": "#f0a"  //PINK
    };
    
    var computePieSectors = function() {
      //console.log("DROPLETS:", $scope.account.Balance);
      //console.log("BALANCES:", $scope.balances);
      var xrpAsSuch = $scope.account.Balance / 1000000;
      var balancesAsXrp = [xrpAsSuch];
      var totalAsXrp = xrpAsSuch;
      var amounts = ["1"];
      for (var cur in $scope.balances) {if ($scope.balances.hasOwnProperty(cur)){
        var components = $scope.balances[cur].components;
        var totalBalance = 0;
        for (var issuer in components) {if (components.hasOwnProperty(issuer)){
          totalBalance += components[issuer].to_number();
        }}
        var totalBalanceAsXrp = totalBalance * (exchangeRates[cur] || 0);
        totalAsXrp += totalBalanceAsXrp;
        balancesAsXrp.push(totalBalanceAsXrp);
        amounts.push(components[issuer]);
      }}
      
      
      var scaledBalances = balancesAsXrp.map(function(x){return x/totalAsXrp});
      //console.log("DRAWING PIE CHART!", scaledBalances, currencies);
      drawPieChart(
        [0.25,0.5,0.25,0],
        amounts,
        ["#fa0","#af0","#0f0","#0fa"]//currencies.map(function(c){return currencyColors[c]})
      );
      
      //drawPieChart([0.68, 0.25, 0.07], ["ABC","DEF","GHI"], ["#f00","#0f0","#00f"]);
    };

    
    $scope.$watch("account.Balance", computePieSectors);
    $scope.$watch("balances", computePieSectors, true);
    */

  }]);
};

module.exports = BalanceTab;
