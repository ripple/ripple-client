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
    var rpcontactname = $filter('rpcontactname');
    function contactButNotXrp(x) {
      return x==="XRP" ? "XRP" : rpcontactname(x);
    }
    
    function colorHexToRGB(colorHex) {
      if (colorHex.charAt(0) === "#") {
        colorHex = colorHex.slice(1);
      }
      if (colorHex.length === 3) {
        colorHex = ""+
          colorHex.charAt(0)+colorHex.charAt(0)+
          colorHex.charAt(1)+colorHex.charAt(1)+
          colorHex.charAt(2)+colorHex.charAt(2);
      }
      var red   = parseInt(colorHex.substring(0,2), 16),
          green = parseInt(colorHex.substring(2,4), 16),
          blue  = parseInt(colorHex.substring(4,6), 16);
      return [red, green, blue];
    }
    
    function colorRGBToHex(colorRGB) {
      return "#" + colorRGB.map(function(v){
        var s = Math.round(v).toString(16);
        s.length === 1 && (s = "0"+s);
        return s;
      }).join("");
    }
    
    function invertColorRGB(colorRGB) {
      return [
        255-colorRGB[0],
        255-colorRGB[1],
        255-colorRGB[2]
      ];
    }
    
    function darken(colorHex, factor) {
      return colorRGBToHex(
        colorHexToRGB(colorHex).map(function(v){return v/factor})
      );
    }
    
    function lighten(colorHex, factor) {
      return colorRGBToHex(
        invertColorRGB(
          invertColorRGB(
            colorHexToRGB(colorHex)
          ).map(function(v){return v/factor})
        )
      );
    }
    
    function shades(colorHex) {
      return [
        darken(colorHex, 3),
        lighten(colorHex, 2),
        darken(colorHex, 2),
        lighten(colorHex, 3),
        colorHex
      ];
    }
    
    /*var exchangeRates = {
      XRP: 1,
      USD: 196,
      BTC: 121000,
      CNY: 32
    };*/
    
    function drawPieChart(container, scope) {
      var exchangeRates = scope.exchangeRates;
      
      if (exchangeRates && Object.keys(exchangeRates).length) {
        exchangeRates["XRP"] = 1;
      } else {
        return;
      }
      
      //console.log("DRAWING PIE WITH RATES:", exchangeRates);
    
      //console.log("DRAW PIE CHART!", scope.ious);
      var xrpAsSuch = parseInt(scope.drops,10) / 1000000;      
      var subbalancesAsXrp = [[xrpAsSuch]];
      var totalAsXrp = xrpAsSuch;
      var amounts = ["1"];
      var issuerses = [["XRP"]];
      for (var cur in scope.ious) {if (scope.ious.hasOwnProperty(cur)){
        var components = scope.ious[cur].components;
        
        var sbs = [];
        var issuers = [];
        
        for (var issuer in components) {if (components.hasOwnProperty(issuer)){
          var rate = (exchangeRates[cur+":"+issuer] || 0);
          var sbAsXrp = components[issuer].to_number() * rate;
          totalAsXrp += sbAsXrp;
          sbs.push(sbAsXrp);
          issuers.push(issuer);
        }}
        subbalancesAsXrp.push(sbs);
        issuerses.push(issuers);
        amounts.push(components[issuer]); //This is kinda sketchy but it works
      }}
      
      // Scale to have an overall sum of 1
      var subshareses = subbalancesAsXrp.map(function(x){return x.map(function(y){return y/totalAsXrp})});
      
      // Add up each group of subshares to get shares
      var shares = subshareses.map(function(x){return x.reduce(function(a,b){return a+b})});
      
      //console.log("SHARES!", shares);
      //console.log("SUBSHARESES!", subshareses);

      var currencies = amounts.map(function(a){return rpcurrency(a)});
      

      
      

      // TODO: make this better
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
      
      var colors = currencies.map(function(c){return currencyColors[c] || "#00f";});
      
      // Prepare the container
      container.find('*').remove()
      container.append('<svg></svg>');
      
      // Draw the subsectors
      for (var i=0; i<subshareses.length; i++) {
        var offset = 0;
        for (var j=0; j<i; j++) {
          offset += shares[j];
        }
        drawSectors(
          container,
          subshareses[i],
          issuerses[i].map(contactButNotXrp),
          shades(colors[i]), //["#999","#111"], //TODO
          "sub",
          currencies[i],
          offset
        );
      }
      
      // Draw the main sectors.
      // This must come last, so that the onMouseOver works.
      drawSectors(container, shares, currencies, colors, "main", currencies);
      
      // Draw the hole in the middle
      $('<circle></circle>').appendTo(container.find('svg')).attr({
        fill: "#fff",
        cx:   60,
        cy:   60,
        r:    20
      });
      
      // And finally...
      container.html(container.html()); // <- some bullshit right here
      
      
      // Center text elements
      container.find("text").each(function(){
        var width = $(this)[0].getBBox().width;
        var x = $(this).attr("x");
        $(this).attr("x",x - width/2);
      });
      
      // Define hovering behavior
      container.find("path.main").on("mouseover", function(){
        var group = $(this).attr("group");
        container.find(".main").css("opacity",0);
        container.find("path.main").css("opacity",0.125);
        $(this).css("opacity",0);
        container.find(".sub[group='"+group+"']").css("opacity",1);
      }).on("mouseout", function(){
        container.find(".main").css("opacity",1);
        container.find(".sub").css("opacity",0);
      });
      
      //Done!
    }
    
    
    function drawSectors(container, shares, labels, colors, cssClass, grouping, offset) {
      var TAU = Math.PI*2;
      
      if (offset) {
        shares.unshift(offset);
        labels.unshift("!"); // This should never actually appear in the view.
        colors.unshift(colors.pop());
      }
      
      
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
      
      var polarToRect = function(radius, angle) {
        return [
          center[0]+radius*Math.sin(angle), 
          center[1]-radius*Math.cos(angle)
        ];
      };
      
      
      
      var sectors = [];
      for ((offset ? i=1 : i=0); i<shares.length; i++) {
        var share = shares[i];
        if (share !== 0) {
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
            color: colors[i % colors.length],
            labelPosition: labelPosition,
            labelText: labels[i],
            group: "string"===typeof(grouping) ? grouping : grouping[i], //TODO move this out to make it more efficient
            share: share
          });
        }
      }

      var svg = container.find('svg').attr({
        width: "100%",
        height: 190,
        viewBox: "-34 -34 188 188",
        "xmlns:svg": "http://www.w3.org/2000/svg",
        "xmlns":     "http://www.w3.org/2000/svg"
      });
      
      for (i=0; i<sectors.length; i++) {
        var sector = sectors[i];
        
        $('<path></path>').appendTo(svg).attr({
          fill: sector.color,
          stroke: sector.color,
          d: sector.path,
          "class": cssClass,
          group: sector.group
        });
        
        $('<text></text>').appendTo(svg).text(sector.labelText).attr({
          x: sector.labelPosition.x,
          y: sector.labelPosition.y,
          "class": cssClass,
          group: sector.group
        });
        
        $('<text></text>').appendTo(svg).text(Math.round(sector.share*100)+"%").attr({
          "class": cssClass + " percentage",
          x: sector.labelPosition.x,
          y: sector.labelPosition.y+14,
          group: sector.group
        });
      }
    }
    
    
    return {
      restrict: 'A',
      scope: {
        drops: '=rpDrops',
        ious: '=rpIous',
        exchangeRates: '=rpExchangeRates'
      },
      link: function(scope, element, attributes) {
        drawPieChart(element, scope),
        scope.$watch('drops', function() {
          console.log("DROPS WATCH TRIGGERED");
          drawPieChart(element, scope);
        });
        scope.$watch('ious', function() {
          drawPieChart(element, scope);
        }, true);
        scope.$watch('exchangeRates', function() {
          console.log("EXCHANGE RATE WATCH TRIGGERED");
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

  module.controller('BalanceCtrl', ['$rootScope', 'rpId', '$filter', 'rpAppManager',
                                     function ($scope, $id, $filter, appManager)
  {
    if (!$id.loginStatus) return $id.goId();
    
    //console.log("$FILTER!!", $filter);
    
    $scope.selectedValueMetric = "XRP";
    
    $scope.changeMetric = function(scope){
      //console.log("THAT!", that);
      //var metric = that.value;
      $scope.selectedValueMetric = scope.selectedValueMetric;
      
    };
    
    $scope.$watch("selectedValueMetric", function(){
      console.log("SELECTED VALUE METRIC!", $scope.selectedValueMetric);
      updateAggregateValueDisplayed();
    })
    
    $scope.exchangeRates = {"XRP":1};
    
    $scope.$watch("exchangeRates", function(){
      //var curs = Object.keys($scope.exchangeRates);
      if ($scope.exchangeRates) {
        var isAmbiguous = {};
        var okser = Object.keys($scope.exchangeRates);
        outerLoop: for (var i=0; i<okser.length; i++) {
          var cur = okser[i].split(":")[0];
          if (isAmbiguous[cur] && isAmbiguous.hasOwnProperty(cur)) { //In case there's a currency called "constructor" or something
            continue; //todo: get rid of this
          } else {
            for (var j=i+1; j<okser.length; j++) {
              var cur2 = okser[j].split(":")[0];
              if (cur === cur2) {
                isAmbiguous[cur] = true;
                break outerLoop; //todo: get rid of this
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
            text: currencyName + (isAmbiguous[currencyName] ? " ("+ issuerName +")" : "")
          };
        });
      }
      // Don't include XRP
      updateAggregateValueAsXrp();
    }, true);
    
    function updateAggregateValueAsXrp() {
      if ( $scope.exchangeRates) {
        //do stuff
        var av = $scope.account.Balance / 1000000;
        
        //TODO: a lot of this is duplicated from up above.
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
      if ( $scope.exchangeRates) {
        $scope.aggregateValueDisplayed =  $scope.aggregateValueAsXrp / $scope.exchangeRates[$scope.selectedValueMetric];
      }
    }
    
    $scope.$watch("balances", function(){
      var currencies = [];
      for (var cur in $scope.balances) {if ($scope.balances.hasOwnProperty(cur)){
      var components = $scope.balances[cur].components;
        for (var issuer in components) {if (components.hasOwnProperty(issuer)){
          currencies.push({
            currency: cur,
            issuer: issuer
          });
        }}
      }}
      var pairs = currencies.map(function(c){
        return {
          base:c,
          counter:{currency:"XRP"}
        }
      });
      
      $.post("https://api.ripplecharts.com/api/exchangeRates", {pairs:pairs,last:true}, function(response){
        console.log("RIPPLE CHARTS RESPONSE!", response);
        for (var i=0; i<response.length; i++) {
          var pair = response[i];
          $scope.exchangeRates[pair.base.currency+":"+pair.base.issuer] = pair.last;
        }
        //$scope.exchangeRates = exchangeRates;
      });
      updateAggregateValueAsXrp();
    }, true);
    

  }]);
};

module.exports = BalanceTab;
