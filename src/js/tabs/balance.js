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
        darken(colorHex, Math.SQRT2),
        lighten(colorHex, Math.SQRT2)
      ];
    }
    
    
    
    function drawPieChart(container, scope) {
      var exchangeRates = scope.exchangeRates;
      
      if (scope.drops && exchangeRates && Object.keys(exchangeRates).length) {} else {
        return;
      }
      
      var xrpAsSuch = parseInt(scope.drops,10) / 1000000;      
      var subbalancesAsXrp = [[xrpAsSuch]];
      var totalAsXrp = xrpAsSuch;
      var amounts = ["1"];
      var issuerses = [["XRP"]];
      for (var cur in scope.ious) {if (scope.ious.hasOwnProperty(cur)){
        var components = scope.ious[cur].components;
        
        var sbs = [];
        var issuers = [];
        var issuer;
        for (issuer in components) {if (components.hasOwnProperty(issuer)){
          var rate = (exchangeRates[cur+":"+issuer] || 0);
          var sbAsXrp = components[issuer].to_number() * rate;
          totalAsXrp += sbAsXrp;
          sbs.push(sbAsXrp);
          issuers.push(issuer);
        }}
        subbalancesAsXrp.push(sbs);
        issuerses.push(issuers);
        amounts.push(components[issuer]);
      }}
      
      // Scale to have an overall sum of 1
      var subshareses = subbalancesAsXrp.map(function(x){return x.map(function(y){return y/totalAsXrp})});
      // Add up each group of subshares to get shares
      var shares = subshareses.map(function(x){return x.reduce(function(a,b){return a+b})});
      var currencies = amounts.map(function(a){return rpcurrency(a)});

      // TODO: make this better
      var currencyColors = {
        XRP : '#346aa9',
        USD : "#32b450",
        BTC : "#dc8246",
        EUR : "#fae632",
        CNY : "#c82832",
        JPY : "#8c466e",
        CAD : "#8264be"
      };
      
      var colors = currencies.map(function(c){return currencyColors[c] || "#3c3ca0";});
      
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
          shades(colors[i]),
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
      container.html(container.html());
      
      
      // Center text elements
      container.find("text").each(function(){
        var width = $(this)[0].getBBox().width;
        var x = $(this).attr("x");
        $(this).attr("x",x - width/2);
      });
      
      //Resolve collisions and adjust viewBox:
      var extremeBounds = resolveCollisions(container);
      var MARGIN = 5
      container.find('svg')[0].setAttribute("viewBox",
        (extremeBounds.left-MARGIN)+" "+
        (extremeBounds.top-MARGIN)+" "+
        (extremeBounds.right-extremeBounds.left+MARGIN*2)+" "+
        (extremeBounds.bottom-extremeBounds.top+MARGIN*2)
      );
      
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
      
      
    }
    
    
    function drawSectors(container, shares, labels, colors, cssClass, grouping, offset) {
      var TAU = Math.PI*2;
      if (shares.length && shares[0] === 1) {
        shares[0] = 0.9999;
      }
      if (offset) {
        shares.unshift(offset);
        labels.unshift("!"); // This should never actually appear in the view.
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
            color: colors[sectors.length % colors.length],
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
        "xmlns:svg": "http://www.w3.org/2000/svg",
        "xmlns":     "http://www.w3.org/2000/svg"
      });
      
      var sector;
      for (i=0; i<sectors.length; i++) {
        sector = sectors[i];
        
        $('<path></path>').appendTo(svg).attr({
          fill: sector.color,
          stroke: sector.color,
          d: sector.path,
          "class": cssClass,
          group: sector.group
        });
      }

      for (i=0; i<sectors.length; i++) {
        sector = sectors[i];
        
        var g = $('<g></g>').appendTo(svg).attr({
          "class": cssClass + " pielabel",
          group: sector.group
        });
        
        $('<text></text>').appendTo(g).text(sector.labelText).attr({
          x: sector.labelPosition.x,
          y: sector.labelPosition.y,
          "class": cssClass,
          group: sector.group
        });
        
        $('<text></text>').appendTo(g).text(Math.round(sector.share*100)+"%").attr({
          "class": cssClass + " percentage",
          x: sector.labelPosition.x,
          y: sector.labelPosition.y+14,
          group: sector.group
        });
      }
    }
    
    
    
    function resolveCollisions(container) {
      var svg = container.find('svg');
      var bounds = [];

      var iterations=0, mainBounds, changed, temp;
      do {
        temp = resolveCollisionsInSelection(svg.find("g.main.pielabel"));
        mainBounds = temp[0];
        changed = temp[1];
        iterations++;
      } while (changed && iterations<10);
      bounds.push(mainBounds);
      
      var groups = {};
      svg.find("g.sub.pielabel").each(function(){
        groups[$(this).attr("group")] = true;
      });
      var okg = Object.keys(groups);
      var i;
      var groupBounds;
      for (i=0; i<okg.length; i++) {
        var group = okg[i];
        var selection = svg.find("g.sub.pielabel[group='"+group+"']");
        iterations = 0;
        do {
          temp = resolveCollisionsInSelection(selection);
          groupBounds = temp[0];
          changed = temp[1];
          iterations++;
        } while (changed && iterations<10);
        bounds.push(groupBounds);
      }
      return findExtremeBounds(bounds);
    }
    
    function findExtremeBounds(bounds) {
      var extrema = {
        left:    0,
        right:  120,
        top:     0,
        bottom: 120
      };
      
      for (var i=0; i<bounds.length; i++) {
        var bound = bounds[i];
        extrema = {
          left:   Math.min(extrema.left, bound.left),
          right:  Math.max(extrema.right, bound.right),
          top:    Math.min(extrema.top, bound.top),
          bottom: Math.max(extrema.bottom, bound.bottom)
        };
      }
      return extrema;
    }
    
    function resolveCollisionsInSelection(selection) {
      var bounds = [];
      selection.each(function(){
        var bbox = $(this)[0].getBBox();
        bounds.push({
          left:   bbox.x,
          right:  bbox.x+bbox.width,
          top:    bbox.y,
          bottom: bbox.y+bbox.height
        });
      });
      var collisions = {};
      var collider, collidee;
      for (collider=0; collider<bounds.length; collider++) {
        var colliderBounds = bounds[collider];
        for (collidee=0; collidee<bounds.length; collidee++) { if (collider !== collidee) {
          var collideeBounds = bounds[collidee];
          var collisionLR = colliderBounds.right - collideeBounds.left;
          var collisionRL = colliderBounds.left - collideeBounds.right;
          var collisionTB = colliderBounds.bottom - collideeBounds.top;
          var collisionBT = colliderBounds.top - collideeBounds.bottom;
          
          if (collisionLR > 0 && collisionRL < 0 && collisionTB > 0 && collisionBT < 0) {
            if (!collisions[collider]) {
              collisions[collider] = {};
            }
            if (!collisions[collider][collidee]) {
              collisions[collider][collidee] = {};
            }
            collisions[collider][collidee] = {
              x: (collisionLR > -collisionRL ? collisionRL : collisionLR),
              y: (collisionTB > -collisionBT ? collisionBT : collisionTB)
            };
          }
        }}
      }
      
      
      function adjustBy(collision, coordinate) {
        return function() {
          var t = $(this).attr(coordinate);
          var adjustment = collision[coordinate];
          $(this).attr(coordinate,t-adjustment/1.9);
        }
      }
      
      
      for (collider in collisions) {if (collisions.hasOwnProperty(collider)) {
        var collidingWith = collisions[collider];
        for (collidee in collidingWith) {if (collidingWith.hasOwnProperty(collidee)) {
          var collision = collidingWith[collidee];
          var g = $(selection[collider]);
          if (false || Math.abs(collision.x) < Math.abs(collision.y)) { //TODO: Be smarter about this
            g.find("text").each(adjustBy(collision,"x"));
          } else {
            g.find("text").each(adjustBy(collision,"y"));
          }
        }}
      }}
            
      return [
        findExtremeBounds(bounds),
        !!(Object.keys(collisions).length)
      ];
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
          drawPieChart(element, scope);
        });
        scope.$watch('ious', function() {
          drawPieChart(element, scope);
        }, true);
        scope.$watch('exchangeRates', function() {
          drawPieChart(element, scope);
        }, true);
      }
    };
  }]); 
  

  module.controller('BalanceCtrl', ['$rootScope', 'rpId', '$filter', '$http', 'rpAppManager',
                                     function ($scope, $id, $filter, $http, appManager)
  {
    if (!$id.loginStatus) return $id.goId();
        
    $scope.selectedValueMetric = "XRP";
    $scope.changeMetric = function(scope){
      $scope.selectedValueMetric = scope.selectedValueMetric;
    };
    
    $scope.$watch("selectedValueMetric", function(){
      if ($scope.aggregateValueAsXrp) {
        updateAggregateValueDisplayed();
      }
    })
    
    $scope.exchangeRates = {"XRP":1};
    
    $scope.$watch("exchangeRates", function(){
      var isAmbiguous = {};
      var okser = Object.keys($scope.exchangeRates);
      for (var i=0; i<okser.length; i++) {
        var cur = okser[i].split(":")[0];
        if (isAmbiguous[cur] && isAmbiguous.hasOwnProperty(cur)) { //In case there's a currency called "constructor" or something
          continue; //todo: get rid of this
        } else {
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
    }, true);
    
    function updateAggregateValueAsXrp() {
      if ( $scope.account.Balance) {
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
      $scope.aggregateValueDisplayed = $scope.aggregateValueAsXrp / $scope.exchangeRates[$scope.selectedValueMetric];
    }
    
    $scope.$watch("account.Balance", updateAggregateValueAsXrp);
    
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
      if (pairs.length) {
        $http.post("https://api.ripplecharts.com/api/exchangeRates", {pairs:pairs,last:true})
        .success(function(response){
          for (var i=0; i<response.length; i++) {
            var pair = response[i];
            $scope.exchangeRates[pair.base.currency+":"+pair.base.issuer] = pair.last;
          }
          updateAggregateValueAsXrp();
        });
      }
    }, true);
    

  }]);
};

module.exports = BalanceTab;
